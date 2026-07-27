import { Injectable } from '@nestjs/common';
import type { Prisma, ProductVariant as PrismaVariant } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { ProductVariantEntity } from '../../domain/entities/product-variant.entity';
import type {
  BulkUpdateVariantsData,
  CreateVariantData,
  ListVariantsParams,
  ListVariantsResult,
  ProductVariantRepositoryPort,
  UpdateVariantData,
} from '../../domain/ports/product-variant.repository.port';
import type { ProductVariantStatus } from '../../domain/value-objects/product-enums';

type VariantWithOptionValues = PrismaVariant & { optionValues: { optionValueId: string }[] };

const WITH_OPTION_VALUES = { optionValues: { select: { optionValueId: true } } };

@Injectable()
export class PrismaProductVariantRepository implements ProductVariantRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ProductVariantEntity | null> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id },
      include: WITH_OPTION_VALUES,
    });
    return variant ? this.toEntity(variant) : null;
  }

  async existsBySku(sku: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.productVariant.count({
      where: { sku, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return count > 0;
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.productVariant.count({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return count > 0;
  }

  async create(data: CreateVariantData): Promise<ProductVariantEntity> {
    const variant = await this.prisma.productVariant.create({
      data: this.toCreateInput(data),
      include: WITH_OPTION_VALUES,
    });
    return this.toEntity(variant);
  }

  async createMany(items: CreateVariantData[]): Promise<number> {
    if (items.length === 0) return 0;

    await this.prisma.$transaction(
      items.map((item) => this.prisma.productVariant.create({ data: this.toCreateInput(item) })),
    );

    return items.length;
  }

  async update(id: string, data: UpdateVariantData): Promise<ProductVariantEntity> {
    const variant = await this.prisma.productVariant.update({
      where: { id },
      data,
      include: WITH_OPTION_VALUES,
    });
    return this.toEntity(variant);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productVariant.delete({ where: { id } });
  }

  async findMany(params: ListVariantsParams): Promise<ListVariantsResult> {
    const where: Prisma.ProductVariantWhereInput = {
      productId: params.productId,
      ...(params.status?.length ? { status: { in: params.status } } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.productVariant.findMany({
        where,
        include: WITH_OPTION_VALUES,
        orderBy: { createdAt: 'asc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.productVariant.count({ where }),
    ]);

    return { items: items.map((variant) => this.toEntity(variant)), total };
  }

  async findManyPublic(
    productId: string,
    page: number,
    pageSize: number,
  ): Promise<ListVariantsResult> {
    const where: Prisma.ProductVariantWhereInput = { productId, status: 'ACTIVE' };

    const [items, total] = await Promise.all([
      this.prisma.productVariant.findMany({
        where,
        include: WITH_OPTION_VALUES,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.productVariant.count({ where }),
    ]);

    return { items: items.map((variant) => this.toEntity(variant)), total };
  }

  async bulkUpdate(ids: string[], data: BulkUpdateVariantsData): Promise<void> {
    await this.prisma.productVariant.updateMany({ where: { id: { in: ids } }, data });
  }

  async existingCombinationKeys(productId: string): Promise<Set<string>> {
    const rows = await this.prisma.productVariant.findMany({
      where: { productId },
      select: { combinationKey: true },
    });
    return new Set(rows.map((row) => row.combinationKey));
  }

  private toCreateInput(data: CreateVariantData): Prisma.ProductVariantCreateInput {
    return {
      product: { connect: { id: data.productId } },
      sku: data.sku,
      slug: data.slug,
      title: data.title,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      weight: data.weight,
      barcode: data.barcode,
      imageId: data.imageId,
      combinationKey: data.combinationKey,
      optionValues: {
        create: data.optionValueIds.map((optionValueId) => ({
          optionValue: { connect: { id: optionValueId } },
        })),
      },
    };
  }

  private toEntity(variant: VariantWithOptionValues): ProductVariantEntity {
    return new ProductVariantEntity({
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      barcode: variant.barcode,
      slug: variant.slug,
      title: variant.title,
      price: variant.price.toNumber(),
      compareAtPrice: variant.compareAtPrice?.toNumber() ?? null,
      weight: variant.weight,
      imageId: variant.imageId,
      status: variant.status as ProductVariantStatus,
      optionValueIds: variant.optionValues.map((ov) => ov.optionValueId),
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    });
  }
}
