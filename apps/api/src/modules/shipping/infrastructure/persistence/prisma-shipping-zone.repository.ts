import { Injectable } from '@nestjs/common';
import type { ShippingZone as PrismaShippingZone } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { ShippingZoneEntity } from '../../domain/entities/shipping-zone.entity';
import type {
  CreateZoneData,
  ShippingZoneRepositoryPort,
  UpdateZoneData,
} from '../../domain/ports/shipping-zone.repository.port';

function toEntity(row: PrismaShippingZone): ShippingZoneEntity {
  return new ShippingZoneEntity({
    id: row.id,
    name: row.name,
    countries: row.countries,
    states: row.states,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaShippingZoneRepository implements ShippingZoneRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ShippingZoneEntity | null> {
    const row = await this.prisma.shippingZone.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findMany(): Promise<ShippingZoneEntity[]> {
    const rows = await this.prisma.shippingZone.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toEntity);
  }

  async create(data: CreateZoneData): Promise<ShippingZoneEntity> {
    const row = await this.prisma.shippingZone.create({
      data: {
        name: data.name,
        countries: data.countries,
        states: data.states ?? [],
      },
    });
    return toEntity(row);
  }

  async update(id: string, data: UpdateZoneData): Promise<ShippingZoneEntity> {
    const row = await this.prisma.shippingZone.update({ where: { id }, data });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.shippingZone.delete({ where: { id } });
  }
}
