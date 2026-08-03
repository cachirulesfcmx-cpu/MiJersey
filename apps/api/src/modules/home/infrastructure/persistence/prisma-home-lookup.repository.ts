import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  BrandLookupSummary,
  CategoryLookupSummary,
  CollectionLookupSummary,
  HomeLookupPort,
  ProductLookupSummary,
} from '../../domain/ports/home-lookup.port';

/** Lectura propia de Home sobre `products`/`categories`/`collections`/`brands` vía Prisma directo — sin importar CatalogModule/TaxonomyModule/BrandsModule (mismo patrón que SEO en 012). */
@Injectable()
export class PrismaHomeLookupRepository implements HomeLookupPort {
  constructor(private readonly prisma: PrismaService) {}

  async findProductsByIds(ids: string[]): Promise<ProductLookupSummary[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.product.findMany({
      where: { id: { in: ids }, status: 'ACTIVE', visibility: 'PUBLIC', deletedAt: null },
      select: {
        id: true,
        slug: true,
        name: true,
        variants: {
          where: { status: 'ACTIVE' },
          orderBy: { price: 'asc' },
          take: 1,
          select: { price: true, imageId: true, compareAtPrice: true },
        },
        // Fallback a la galería del producto (ProductMedia, 015) -- `variant.imageId` es un
        // override opcional (007) que el catálogo legacy importado nunca pobló.
        media: { orderBy: { sortOrder: 'asc' }, take: 1, select: { mediaId: true } },
      },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids
      .map((id) => byId.get(id))
      .filter((row): row is (typeof rows)[number] => row !== undefined)
      .map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        imageMediaId: row.variants[0]?.imageId ?? row.media[0]?.mediaId ?? null,
        fromPrice: row.variants[0] ? Number(row.variants[0].price) : null,
        compareAtPrice: row.variants[0]?.compareAtPrice
          ? Number(row.variants[0].compareAtPrice)
          : null,
      }));
  }

  async findCategoriesByIds(ids: string[]): Promise<CategoryLookupSummary[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.category.findMany({
      where: { id: { in: ids }, status: 'ACTIVE' },
      select: { id: true, slug: true, name: true, image: true },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids
      .map((id) => byId.get(id))
      .filter((row): row is (typeof rows)[number] => row !== undefined)
      .map((row) => ({ id: row.id, slug: row.slug, name: row.name, imageUrl: row.image }));
  }

  async findCollectionsByIds(ids: string[]): Promise<CollectionLookupSummary[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.collection.findMany({
      where: { id: { in: ids }, status: 'ACTIVE' },
      select: { id: true, slug: true, name: true },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids
      .map((id) => byId.get(id))
      .filter((row): row is (typeof rows)[number] => row !== undefined)
      .map((row) => ({ id: row.id, slug: row.slug, name: row.name }));
  }

  async findBrandsByIds(ids: string[]): Promise<BrandLookupSummary[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.brand.findMany({
      where: { id: { in: ids }, status: 'ACTIVE' },
      select: { id: true, slug: true, name: true, logoMediaId: true },
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids
      .map((id) => byId.get(id))
      .filter((row): row is (typeof rows)[number] => row !== undefined)
      .map((row) => ({ id: row.id, slug: row.slug, name: row.name, logoMediaId: row.logoMediaId }));
  }
}
