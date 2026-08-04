import { Injectable } from '@nestjs/common';
import type { Prisma, ProductStatus, ProductType } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { MediaUsageService } from '../../../media/application/services/media-usage.service';
import type {
  FindMatchingRulesParams,
  ProductQueryPort,
  ProductSummary,
  SmartRuleInput,
} from '../../domain/ports/product-query.port';

/** Producto crudo con lo mínimo que `toSummary` necesita para resolver imagen/precio/rating. */
type ProductWithPricingRow = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  type: ProductType;
  status: ProductStatus;
  visibility: string;
  variants: {
    id: string;
    price: Prisma.Decimal;
    compareAtPrice: Prisma.Decimal | null;
    imageId: string | null;
  }[];
  media: { mediaId: string }[];
};

const PRICING_INCLUDE = {
  variants: {
    where: { status: 'ACTIVE' as const },
    orderBy: { price: 'asc' as const },
    take: 1,
    select: { id: true, price: true, compareAtPrice: true, imageId: true },
  },
  // Igual que Attributes (014): la galería (ProductMedia) es la fuente primaria de imagen,
  // variant.imageId es solo un override opcional que el catálogo legacy nunca pobló.
  media: { orderBy: { sortOrder: 'asc' as const }, take: 1, select: { mediaId: true } },
} satisfies Prisma.ProductInclude;

const VALID_PRODUCT_TYPES = ['PHYSICAL', 'DIGITAL'];
const VALID_PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'];
/** Condición que nunca puede cumplirse; se usa cuando una regla trae un valor fuera de rango. */
const NEVER_MATCHES: Prisma.ProductWhereInput = { id: '' };

function buildCondition(rule: SmartRuleInput): Prisma.ProductWhereInput {
  switch (rule.field) {
    case 'NAME':
      return rule.operator === 'CONTAINS'
        ? { name: { contains: rule.value, mode: 'insensitive' } }
        : { name: { equals: rule.value, mode: 'insensitive' } };
    case 'SKU':
      return rule.operator === 'CONTAINS'
        ? { sku: { contains: rule.value, mode: 'insensitive' } }
        : { sku: { equals: rule.value.toUpperCase() } };
    case 'TYPE':
      return VALID_PRODUCT_TYPES.includes(rule.value)
        ? { type: rule.value as ProductType }
        : NEVER_MATCHES;
    case 'STATUS':
      return VALID_PRODUCT_STATUSES.includes(rule.value)
        ? { status: rule.value as ProductStatus }
        : NEVER_MATCHES;
    default:
      return NEVER_MATCHES;
  }
}

function buildRulesWhere(
  rules: SmartRuleInput[],
  matchType: 'ALL' | 'ANY',
): Prisma.ProductWhereInput {
  if (rules.length === 0) return {};
  const conditions = rules.map(buildCondition);
  return matchType === 'ALL' ? { AND: conditions } : { OR: conditions };
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

  async findByIds(productIds: string[]): Promise<ProductSummary[]> {
    if (productIds.length === 0) return [];

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      include: PRICING_INCLUDE,
    });
    return this.toSummaries(products);
  }

  async findMatchingRules(
    params: FindMatchingRulesParams,
  ): Promise<{ items: ProductSummary[]; total: number }> {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...buildRulesWhere(params.rules, params.matchType),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: PRICING_INCLUDE,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: await this.toSummaries(items), total };
  }

  /** Resuelve imagen/precio/rating para todo el lote de una sola vez (batch), mismo criterio que Attributes (014) y Home (013). */
  private async toSummaries(products: ProductWithPricingRow[]): Promise<ProductSummary[]> {
    if (products.length === 0) return [];

    const mediaIds = [
      ...new Set(
        products
          .map((product) => product.variants[0]?.imageId ?? product.media[0]?.mediaId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const mediaEntries = await Promise.all(
      mediaIds.map(async (id) => [id, await this.mediaUsage.resolveUrls(id)] as const),
    );
    const mediaUrlById = new Map(mediaEntries.map(([id, resolved]) => [id, resolved?.url ?? null]));

    const productIds = products.map((product) => product.id);
    const ratings = await this.prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds }, status: 'APPROVED' },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const ratingById = new Map(ratings.map((row) => [row.productId, row]));

    return products.map((product) => {
      const cheapestVariant = product.variants[0];
      const imageId = cheapestVariant?.imageId ?? product.media[0]?.mediaId ?? null;
      const rating = ratingById.get(product.id);
      return {
        id: product.id,
        sku: product.sku,
        slug: product.slug,
        name: product.name,
        type: product.type,
        status: product.status,
        visibility: product.visibility,
        imageUrl: imageId ? (mediaUrlById.get(imageId) ?? null) : null,
        price: cheapestVariant ? Number(cheapestVariant.price) : null,
        compareAtPrice: cheapestVariant?.compareAtPrice
          ? Number(cheapestVariant.compareAtPrice)
          : null,
        rating: rating?._avg.rating ?? null,
        reviewCount: rating?._count.rating ?? 0,
        defaultVariantId: cheapestVariant?.id ?? null,
      };
    });
  }
}
