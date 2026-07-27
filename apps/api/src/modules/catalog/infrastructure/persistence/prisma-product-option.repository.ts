import { Injectable } from '@nestjs/common';
import type {
  ProductOption as PrismaProductOption,
  ProductOptionValue as PrismaProductOptionValue,
} from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { ProductOptionEntity } from '../../domain/entities/product-option.entity';
import { ProductOptionValueEntity } from '../../domain/entities/product-option-value.entity';
import type {
  CreateOptionData,
  ProductOptionRepositoryPort,
} from '../../domain/ports/product-option.repository.port';

type OptionWithValues = PrismaProductOption & { values: PrismaProductOptionValue[] };

const WITH_ORDERED_VALUES = { values: { orderBy: { position: 'asc' as const } } };

@Injectable()
export class PrismaProductOptionRepository implements ProductOptionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ProductOptionEntity | null> {
    const option = await this.prisma.productOption.findUnique({
      where: { id },
      include: WITH_ORDERED_VALUES,
    });
    return option ? this.toEntity(option) : null;
  }

  async findByProductId(productId: string): Promise<ProductOptionEntity[]> {
    const options = await this.prisma.productOption.findMany({
      where: { productId },
      include: WITH_ORDERED_VALUES,
      orderBy: { position: 'asc' },
    });
    return options.map((option) => this.toEntity(option));
  }

  async existsByName(productId: string, name: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.productOption.count({
      where: { productId, name, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return count > 0;
  }

  async create(data: CreateOptionData): Promise<ProductOptionEntity> {
    const option = await this.prisma.productOption.create({
      data: {
        productId: data.productId,
        name: data.name,
        position: data.position,
        values: { create: data.values.map((value, index) => ({ value, position: index })) },
      },
      include: WITH_ORDERED_VALUES,
    });
    return this.toEntity(option);
  }

  async updateName(id: string, name: string): Promise<ProductOptionEntity> {
    const option = await this.prisma.productOption.update({
      where: { id },
      data: { name },
      include: WITH_ORDERED_VALUES,
    });
    return this.toEntity(option);
  }

  async replaceValues(optionId: string, values: string[]): Promise<ProductOptionEntity> {
    const current = await this.prisma.productOptionValue.findMany({ where: { optionId } });
    const currentByValue = new Map(current.map((value) => [value.value, value]));
    const toDelete = current.filter((value) => !values.includes(value.value));

    await this.prisma.$transaction([
      ...(toDelete.length > 0
        ? [
            this.prisma.productOptionValue.deleteMany({
              where: { id: { in: toDelete.map((value) => value.id) } },
            }),
          ]
        : []),
      ...values.map((value, index) => {
        const existing = currentByValue.get(value);
        return existing
          ? this.prisma.productOptionValue.update({
              where: { id: existing.id },
              data: { position: index },
            })
          : this.prisma.productOptionValue.create({ data: { optionId, value, position: index } });
      }),
    ]);

    return (await this.findById(optionId)) as ProductOptionEntity;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productOption.delete({ where: { id } });
  }

  async countVariantsUsingValue(valueId: string): Promise<number> {
    return this.prisma.productVariantOptionValue.count({ where: { optionValueId: valueId } });
  }

  private toEntity(option: OptionWithValues): ProductOptionEntity {
    return new ProductOptionEntity({
      id: option.id,
      productId: option.productId,
      name: option.name,
      position: option.position,
      values: option.values.map(
        (value) =>
          new ProductOptionValueEntity({
            id: value.id,
            optionId: value.optionId,
            value: value.value,
            position: value.position,
          }),
      ),
    });
  }
}
