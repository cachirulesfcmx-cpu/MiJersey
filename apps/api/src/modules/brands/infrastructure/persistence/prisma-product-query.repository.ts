import { Injectable } from '@nestjs/common';
import type { Product as PrismaProduct } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  BrandProductSummary,
  ListBrandProductsParams,
  ListBrandProductsResult,
  ProductQueryPort,
} from '../../domain/ports/product-query.port';

@Injectable()
export class PrismaProductQueryRepository implements ProductQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async exists(productId: string): Promise<boolean> {
    const count = await this.prisma.product.count({ where: { id: productId } });
    return count > 0;
  }

  async findByIds(productIds: string[]): Promise<BrandProductSummary[]> {
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } } });
    return products.map((product) => this.toSummary(product));
  }

  async countByBrand(brandId: string): Promise<number> {
    return this.prisma.product.count({ where: { brandId } });
  }

  async findByBrand(params: ListBrandProductsParams): Promise<ListBrandProductsResult> {
    const { brandId, page, pageSize, onlyPublic, sortBy = 'name', sortDir = 'asc' } = params;

    const where = {
      brandId,
      ...(onlyPublic ? { status: 'ACTIVE' as const, visibility: 'PUBLIC' as const } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: items.map((item) => this.toSummary(item)), total };
  }

  async assignToBrand(productIds: string[], brandId: string): Promise<void> {
    await this.prisma.product.updateMany({ where: { id: { in: productIds } }, data: { brandId } });
  }

  async unassignFromBrand(productIds: string[]): Promise<void> {
    await this.prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { brandId: null },
    });
  }

  async unassignAllFromBrand(brandId: string): Promise<void> {
    await this.prisma.product.updateMany({ where: { brandId }, data: { brandId: null } });
  }

  private toSummary(product: PrismaProduct): BrandProductSummary {
    return {
      id: product.id,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      status: product.status,
      visibility: product.visibility,
      createdAt: product.createdAt,
    };
  }
}
