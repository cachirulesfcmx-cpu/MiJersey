import { Injectable } from '@nestjs/common';
import type { Prisma, Product, ProductVariant } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  SearchVariantsResult,
  VariantQueryPort,
  VariantSummary,
} from '../../domain/ports/variant-query.port';

type VariantWithProduct = ProductVariant & { product: Product };

@Injectable()
export class PrismaVariantQueryRepository implements VariantQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async exists(variantId: string): Promise<boolean> {
    const count = await this.prisma.productVariant.count({ where: { id: variantId } });
    return count > 0;
  }

  async findById(variantId: string): Promise<VariantSummary | null> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    return variant ? this.toSummary(variant) : null;
  }

  async findByIds(variantIds: string[]): Promise<VariantSummary[]> {
    if (variantIds.length === 0) return [];

    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    });
    return variants.map((variant) => this.toSummary(variant));
  }

  async search(query: string, page: number, pageSize: number): Promise<SearchVariantsResult> {
    const where: Prisma.ProductVariantWhereInput = {
      OR: [
        { sku: { contains: query, mode: 'insensitive' } },
        { title: { contains: query, mode: 'insensitive' } },
        { product: { name: { contains: query, mode: 'insensitive' } } },
      ],
    };

    const [items, total] = await Promise.all([
      this.prisma.productVariant.findMany({
        where,
        include: { product: true },
        orderBy: { sku: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.productVariant.count({ where }),
    ]);

    return { items: items.map((variant) => this.toSummary(variant)), total };
  }

  private toSummary(variant: VariantWithProduct): VariantSummary {
    return {
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      title: variant.title,
      productName: variant.product.name,
      status: variant.status,
    };
  }
}
