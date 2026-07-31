import { Injectable } from '@nestjs/common';
import type { ShippingRate as PrismaShippingRate } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { ShippingRateEntity } from '../../domain/entities/shipping-rate.entity';
import type {
  CreateRateData,
  ShippingRateRepositoryPort,
  UpdateRateData,
} from '../../domain/ports/shipping-rate.repository.port';

function toEntity(row: PrismaShippingRate): ShippingRateEntity {
  return new ShippingRateEntity({
    id: row.id,
    carrierId: row.carrierId,
    zoneId: row.zoneId,
    name: row.name,
    basePrice: row.basePrice.toNumber(),
    pricePerKg: row.pricePerKg.toNumber(),
    freeShippingThreshold: row.freeShippingThreshold?.toNumber() ?? null,
    estimatedDaysMin: row.estimatedDaysMin,
    estimatedDaysMax: row.estimatedDaysMax,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaShippingRateRepository implements ShippingRateRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ShippingRateEntity | null> {
    const row = await this.prisma.shippingRate.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findMany(): Promise<ShippingRateEntity[]> {
    const rows = await this.prisma.shippingRate.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toEntity);
  }

  async findActive(): Promise<ShippingRateEntity[]> {
    const rows = await this.prisma.shippingRate.findMany({ where: { isActive: true } });
    return rows.map(toEntity);
  }

  async create(data: CreateRateData): Promise<ShippingRateEntity> {
    const row = await this.prisma.shippingRate.create({
      data: {
        carrierId: data.carrierId,
        zoneId: data.zoneId,
        name: data.name,
        basePrice: data.basePrice,
        pricePerKg: data.pricePerKg ?? 0,
        freeShippingThreshold: data.freeShippingThreshold ?? null,
        estimatedDaysMin: data.estimatedDaysMin,
        estimatedDaysMax: data.estimatedDaysMax,
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
    return toEntity(row);
  }

  async update(id: string, data: UpdateRateData): Promise<ShippingRateEntity> {
    const row = await this.prisma.shippingRate.update({ where: { id }, data });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.shippingRate.delete({ where: { id } });
  }
}
