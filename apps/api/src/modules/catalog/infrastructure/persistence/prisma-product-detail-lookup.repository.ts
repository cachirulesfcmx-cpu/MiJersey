import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  BrandSummary,
  CategorySummary,
  ProductDetailLookupPort,
  ProductRelations,
} from '../../domain/ports/product-detail-lookup.port';

@Injectable()
export class PrismaProductDetailLookupRepository implements ProductDetailLookupPort {
  constructor(private readonly prisma: PrismaService) {}

  async findProductRelations(productId: string): Promise<ProductRelations> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { brandId: true, categories: { select: { categoryId: true } } },
    });
    return {
      brandId: product?.brandId ?? null,
      categoryIds: product?.categories.map((c) => c.categoryId) ?? [],
    };
  }

  async findBrandSummary(brandId: string): Promise<BrandSummary | null> {
    const brand = await this.prisma.brand.findFirst({
      where: { id: brandId, status: 'ACTIVE' },
      select: { id: true, slug: true, name: true, logoMediaId: true },
    });
    return brand;
  }

  async findCategorySummaries(categoryIds: string[]): Promise<CategorySummary[]> {
    if (categoryIds.length === 0) return [];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds }, status: 'ACTIVE' },
      select: { id: true, slug: true, name: true },
    });
    const byId = new Map(categories.map((c) => [c.id, c]));
    return categoryIds.map((id) => byId.get(id)).filter((c): c is CategorySummary => !!c);
  }
}
