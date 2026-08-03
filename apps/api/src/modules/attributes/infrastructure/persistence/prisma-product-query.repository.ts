import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { MediaUsageService } from '../../../media/application/services/media-usage.service';
import type {
  AttributeFilterInput,
  FacetResult,
  ProductListingScope,
  ProductQueryPort,
  SearchProductsParams,
  SearchProductsResult,
} from '../../domain/ports/product-query.port';

/** Solo productos activos y públicos participan en facetas/búsqueda del storefront. */
const PUBLIC_PRODUCT_WHERE: Prisma.ProductWhereInput = {
  deletedAt: null,
  status: 'ACTIVE',
  visibility: 'PUBLIC',
};

function buildAttributeCondition(filter: AttributeFilterInput): Prisma.ProductAttributeWhereInput {
  const or: Prisma.ProductAttributeWhereInput[] = [];
  if (filter.valueIds?.length) {
    or.push({ valueId: { in: filter.valueIds } });
  }
  if (filter.customValues?.length) {
    or.push({ customValue: { in: filter.customValues } });
  }
  return { attributeId: filter.attributeId, ...(or.length > 0 ? { OR: or } : {}) };
}

/** Combina filtros de distintos atributos con AND; valores del mismo atributo se combinan con OR (faceted search estándar). */
function buildFiltersWhere(
  filters: AttributeFilterInput[],
  excludeAttributeId?: string,
): Prisma.ProductWhereInput {
  const applicable = filters.filter((filter) => filter.attributeId !== excludeAttributeId);
  if (applicable.length === 0) return {};

  return {
    AND: applicable.map((filter) => ({ attributes: { some: buildAttributeCondition(filter) } })),
  };
}

/** Alcance de categoría/marca/texto libre (014) — reutilizado por PLP de categorías, marcas y búsqueda. */
function buildScopeWhere(scope?: ProductListingScope): Prisma.ProductWhereInput {
  if (!scope) return {};
  return {
    ...(scope.categoryId ? { categories: { some: { categoryId: scope.categoryId } } } : {}),
    ...(scope.brandId ? { brandId: scope.brandId } : {}),
    ...(scope.excludeProductId ? { id: { not: scope.excludeProductId } } : {}),
    ...(scope.search
      ? {
          OR: [
            { name: { contains: scope.search, mode: 'insensitive' } },
            { sku: { contains: scope.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
}

@Injectable()
export class PrismaProductQueryRepository implements ProductQueryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaUsage: MediaUsageService,
  ) {}

  async exists(productId: string): Promise<boolean> {
    const count = await this.prisma.product.count({ where: { id: productId, deletedAt: null } });
    return count > 0;
  }

  async computeFacets(
    filters: AttributeFilterInput[],
    scope?: ProductListingScope,
  ): Promise<FacetResult[]> {
    const filterableAttributes = await this.prisma.attribute.findMany({
      where: { deletedAt: null, status: 'ACTIVE', isFilterable: true },
      include: { values: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });

    const results: FacetResult[] = [];

    for (const attribute of filterableAttributes) {
      const scopedWhere: Prisma.ProductWhereInput = {
        ...PUBLIC_PRODUCT_WHERE,
        ...buildFiltersWhere(filters, attribute.id),
        ...buildScopeWhere(scope),
      };
      const isValueBased = attribute.type === 'LIST' || attribute.type === 'COLOR';

      if (isValueBased) {
        const grouped = await this.prisma.productAttribute.groupBy({
          by: ['valueId'],
          where: { attributeId: attribute.id, valueId: { not: null }, product: scopedWhere },
          _count: { _all: true },
        });
        const countByValueId = new Map(grouped.map((g) => [g.valueId as string, g._count._all]));

        results.push({
          attributeId: attribute.id,
          code: attribute.code,
          name: attribute.name,
          type: attribute.type,
          isComparable: attribute.isComparable,
          values: attribute.values
            .map((value) => ({
              valueId: value.id,
              value: value.value,
              label: value.label,
              count: countByValueId.get(value.id) ?? 0,
            }))
            .filter((value) => value.count > 0),
        });
      } else {
        const grouped = await this.prisma.productAttribute.groupBy({
          by: ['customValue'],
          where: { attributeId: attribute.id, customValue: { not: null }, product: scopedWhere },
          _count: { _all: true },
        });

        results.push({
          attributeId: attribute.id,
          code: attribute.code,
          name: attribute.name,
          type: attribute.type,
          isComparable: attribute.isComparable,
          values: grouped.map((g) => ({
            valueId: null,
            value: g.customValue as string,
            label: g.customValue as string,
            count: g._count._all,
          })),
        });
      }
    }

    return results.filter((facet) => facet.values.length > 0);
  }

  async searchProducts(params: SearchProductsParams): Promise<SearchProductsResult> {
    const where: Prisma.ProductWhereInput = {
      ...PUBLIC_PRODUCT_WHERE,
      ...buildFiltersWhere(params.filters),
      ...buildScopeWhere(params),
    };
    const sortBy = params.sortBy ?? 'createdAt';
    const sortDir = params.sortDir ?? 'desc';

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          // Misma resolución que Home (013, ver PrismaHomeLookupRepository): la variante activa
          // más barata aporta el precio "de vitrina" del producto en listados.
          variants: {
            where: { status: 'ACTIVE' },
            orderBy: { price: 'asc' },
            take: 1,
            select: { price: true, compareAtPrice: true, imageId: true },
          },
          // Imagen real del producto: la galería (ProductMedia, 015) es la fuente primaria --
          // `variant.imageId` es solo un override opcional por variante (007) que el catálogo
          // legacy importado nunca pobló, así que sin este fallback el listado queda en blanco.
          media: { orderBy: { sortOrder: 'asc' }, take: 1, select: { mediaId: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const mediaIds = [
      ...new Set(
        items
          .map((product) => product.variants[0]?.imageId ?? product.media[0]?.mediaId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const mediaEntries = await Promise.all(
      mediaIds.map(async (id) => [id, await this.mediaUsage.resolveUrls(id)] as const),
    );
    const mediaUrlById = new Map(mediaEntries.map(([id, resolved]) => [id, resolved?.url ?? null]));

    return {
      items: items.map((product) => {
        const cheapestVariant = product.variants[0];
        const imageId = cheapestVariant?.imageId ?? product.media[0]?.mediaId ?? null;
        return {
          id: product.id,
          sku: product.sku,
          slug: product.slug,
          name: product.name,
          status: product.status,
          visibility: product.visibility,
          createdAt: product.createdAt,
          imageUrl: imageId ? (mediaUrlById.get(imageId) ?? null) : null,
          price: cheapestVariant ? Number(cheapestVariant.price) : null,
          compareAtPrice: cheapestVariant?.compareAtPrice
            ? Number(cheapestVariant.compareAtPrice)
            : null,
        };
      }),
      total,
    };
  }
}
