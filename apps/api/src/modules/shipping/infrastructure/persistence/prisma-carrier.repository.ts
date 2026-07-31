import { Injectable } from '@nestjs/common';
import type { Carrier as PrismaCarrier } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { CarrierEntity } from '../../domain/entities/carrier.entity';
import type {
  CarrierRepositoryPort,
  CreateCarrierData,
  UpdateCarrierData,
} from '../../domain/ports/carrier.repository.port';

function toEntity(row: PrismaCarrier): CarrierEntity {
  return new CarrierEntity({
    id: row.id,
    name: row.name,
    code: row.code,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaCarrierRepository implements CarrierRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CarrierEntity | null> {
    const row = await this.prisma.carrier.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByCode(code: string): Promise<CarrierEntity | null> {
    const row = await this.prisma.carrier.findUnique({ where: { code } });
    return row ? toEntity(row) : null;
  }

  async findActive(): Promise<CarrierEntity[]> {
    const rows = await this.prisma.carrier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return rows.map(toEntity);
  }

  async findMany(): Promise<CarrierEntity[]> {
    const rows = await this.prisma.carrier.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toEntity);
  }

  async create(data: CreateCarrierData): Promise<CarrierEntity> {
    const row = await this.prisma.carrier.create({
      data: {
        name: data.name,
        code: data.code,
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
    return toEntity(row);
  }

  async update(id: string, data: UpdateCarrierData): Promise<CarrierEntity> {
    const row = await this.prisma.carrier.update({ where: { id }, data });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.carrier.delete({ where: { id } });
  }
}
