import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import { ProductAttributeEntity } from '../../domain/entities/product-attribute.entity';
import type {
  AssignAttributeData,
  ProductAttributeRepositoryPort,
} from '../../domain/ports/product-attribute.repository.port';

@Injectable()
export class PrismaProductAttributeRepository implements ProductAttributeRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByProduct(productId: string): Promise<ProductAttributeEntity[]> {
    const assignments = await this.prisma.productAttribute.findMany({ where: { productId } });
    return assignments.map(
      (assignment) =>
        new ProductAttributeEntity({
          id: assignment.id,
          productId: assignment.productId,
          attributeId: assignment.attributeId,
          valueId: assignment.valueId,
          customValue: assignment.customValue,
          createdAt: assignment.createdAt,
          updatedAt: assignment.updatedAt,
        }),
    );
  }

  async findOne(productId: string, attributeId: string): Promise<ProductAttributeEntity | null> {
    const assignment = await this.prisma.productAttribute.findUnique({
      where: { productId_attributeId: { productId, attributeId } },
    });
    if (!assignment) return null;

    return new ProductAttributeEntity({
      id: assignment.id,
      productId: assignment.productId,
      attributeId: assignment.attributeId,
      valueId: assignment.valueId,
      customValue: assignment.customValue,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    });
  }

  async upsert(productId: string, data: AssignAttributeData): Promise<ProductAttributeEntity> {
    const assignment = await this.prisma.productAttribute.upsert({
      where: { productId_attributeId: { productId, attributeId: data.attributeId } },
      create: {
        productId,
        attributeId: data.attributeId,
        valueId: data.valueId ?? null,
        customValue: data.customValue ?? null,
      },
      update: {
        valueId: data.valueId ?? null,
        customValue: data.customValue ?? null,
      },
    });

    return new ProductAttributeEntity({
      id: assignment.id,
      productId: assignment.productId,
      attributeId: assignment.attributeId,
      valueId: assignment.valueId,
      customValue: assignment.customValue,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    });
  }

  async remove(productId: string, attributeId: string): Promise<void> {
    await this.prisma.productAttribute.deleteMany({ where: { productId, attributeId } });
  }

  async replaceForProduct(productId: string, items: AssignAttributeData[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.productAttribute.deleteMany({ where: { productId } }),
      ...items.map((item) =>
        this.prisma.productAttribute.create({
          data: {
            productId,
            attributeId: item.attributeId,
            valueId: item.valueId ?? null,
            customValue: item.customValue ?? null,
          },
        }),
      ),
    ]);
  }
}
