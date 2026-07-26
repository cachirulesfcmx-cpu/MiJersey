import { Injectable } from '@nestjs/common';
import type { Prisma, Product as PrismaProduct } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { ProductEntity } from '../../domain/entities/product.entity';
import type {
  CreateProductData,
  ListProductsParams,
  ListProductsResult,
  ProductRepositoryPort,
  UpdateProductData,
} from '../../domain/ports/product.repository.port';
import type {
  ProductStatus,
  ProductType,
  ProductVisibility,
} from '../../domain/value-objects/product-enums';

/** Soft-deleted products (`deletedAt` set) are excluded from every read in this repository. */
const NOT_DELETED: Prisma.ProductWhereInput = { deletedAt: null };

@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ProductEntity | null> {
    const product = await this.prisma.product.findFirst({ where: { id, ...NOT_DELETED } });
    return product ? this.toEntity(product) : null;
  }

  async findBySlug(slug: string): Promise<ProductEntity | null> {
    const product = await this.prisma.product.findFirst({ where: { slug, ...NOT_DELETED } });
    return product ? this.toEntity(product) : null;
  }

  async existsBySku(sku: string): Promise<boolean> {
    const count = await this.prisma.product.count({ where: { sku, ...NOT_DELETED } });
    return count > 0;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.product.count({ where: { slug, ...NOT_DELETED } });
    return count > 0;
  }

  async create(data: CreateProductData): Promise<ProductEntity> {
    const product = await this.prisma.product.create({ data });
    return this.toEntity(product);
  }

  async update(id: string, data: UpdateProductData): Promise<ProductEntity> {
    const product = await this.prisma.product.update({ where: { id }, data });
    return this.toEntity(product);
  }

  async updateStatus(id: string, status: ProductStatus): Promise<void> {
    await this.prisma.product.update({ where: { id }, data: { status } });
  }

  async bulkUpdateStatus(ids: string[], status: ProductStatus): Promise<void> {
    await this.prisma.product.updateMany({ where: { id: { in: ids } }, data: { status } });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async bulkSoftDelete(ids: string[]): Promise<void> {
    await this.prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() },
    });
  }

  async findMany(params: ListProductsParams): Promise<ListProductsResult> {
    const { filter, page, pageSize, sortBy = 'createdAt', sortDir = 'desc' } = params;

    const where: Prisma.ProductWhereInput = {
      ...NOT_DELETED,
      ...(filter?.publicOnly
        ? { status: 'ACTIVE', visibility: 'PUBLIC' }
        : {
            ...(filter?.status?.length ? { status: { in: filter.status } } : {}),
            ...(filter?.visibility?.length ? { visibility: { in: filter.visibility } } : {}),
            ...(filter?.type?.length ? { type: { in: filter.type } } : {}),
          }),
      ...(filter?.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: 'insensitive' } },
              { sku: { contains: filter.search, mode: 'insensitive' } },
              { slug: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: items.map((product) => this.toEntity(product)), total };
  }

  async count(): Promise<number> {
    return this.prisma.product.count({ where: NOT_DELETED });
  }

  private toEntity(product: PrismaProduct): ProductEntity {
    return new ProductEntity({
      id: product.id,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      status: product.status as ProductStatus,
      visibility: product.visibility as ProductVisibility,
      type: product.type as ProductType,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
  }
}
