import { Injectable } from '@nestjs/common';
import type { ShippingMethod as PrismaShippingMethod } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { ShippingMethodEntity } from '../../domain/entities/shipping-method.entity';
import type {
  CreateShippingMethodData,
  ShippingMethodRepositoryPort,
  UpdateShippingMethodData,
} from '../../domain/ports/shipping-method.repository.port';

function toEntity(row: PrismaShippingMethod): ShippingMethodEntity {
  return new ShippingMethodEntity({
    id: row.id,
    name: row.name,
    description: row.description,
    basePrice: row.basePrice.toNumber(),
    estimatedDaysMin: row.estimatedDaysMin,
    estimatedDaysMax: row.estimatedDaysMax,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaShippingMethodRepository implements ShippingMethodRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ShippingMethodEntity | null> {
    const row = await this.prisma.shippingMethod.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findActive(): Promise<ShippingMethodEntity[]> {
    const rows = await this.prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: { basePrice: 'asc' },
    });
    return rows.map(toEntity);
  }

  async findMany(): Promise<ShippingMethodEntity[]> {
    const rows = await this.prisma.shippingMethod.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toEntity);
  }

  async create(data: CreateShippingMethodData): Promise<ShippingMethodEntity> {
    const row = await this.prisma.shippingMethod.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        basePrice: data.basePrice,
        estimatedDaysMin: data.estimatedDaysMin,
        estimatedDaysMax: data.estimatedDaysMax,
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
    return toEntity(row);
  }

  async update(id: string, data: UpdateShippingMethodData): Promise<ShippingMethodEntity> {
    const row = await this.prisma.shippingMethod.update({ where: { id }, data });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.shippingMethod.delete({ where: { id } });
  }
}
