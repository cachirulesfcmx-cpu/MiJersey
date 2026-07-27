import { Injectable } from '@nestjs/common';
import type { Prisma, Warehouse as PrismaWarehouse } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { WarehouseEntity } from '../../domain/entities/warehouse.entity';
import type {
  CreateWarehouseData,
  ListWarehousesParams,
  ListWarehousesResult,
  UpdateWarehouseData,
  WarehouseRepositoryPort,
} from '../../domain/ports/warehouse.repository.port';
import type { WarehouseStatus } from '../../domain/value-objects/inventory-enums';

@Injectable()
export class PrismaWarehouseRepository implements WarehouseRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<WarehouseEntity | null> {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    return warehouse ? this.toEntity(warehouse) : null;
  }

  async findByCode(code: string): Promise<WarehouseEntity | null> {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { code } });
    return warehouse ? this.toEntity(warehouse) : null;
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.warehouse.count({ where: { code } });
    return count > 0;
  }

  async findAllActive(): Promise<WarehouseEntity[]> {
    const warehouses = await this.prisma.warehouse.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
    return warehouses.map((warehouse) => this.toEntity(warehouse));
  }

  async findMany(params: ListWarehousesParams): Promise<ListWarehousesResult> {
    const { filter, page, pageSize } = params;

    const where: Prisma.WarehouseWhereInput = {
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: 'insensitive' } },
              { code: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.warehouse.count({ where }),
    ]);

    return { items: items.map((warehouse) => this.toEntity(warehouse)), total };
  }

  async create(data: CreateWarehouseData): Promise<WarehouseEntity> {
    const warehouse = await this.prisma.warehouse.create({ data });
    return this.toEntity(warehouse);
  }

  async update(id: string, data: UpdateWarehouseData): Promise<WarehouseEntity> {
    const warehouse = await this.prisma.warehouse.update({ where: { id }, data });
    return this.toEntity(warehouse);
  }

  private toEntity(warehouse: PrismaWarehouse): WarehouseEntity {
    return new WarehouseEntity({
      id: warehouse.id,
      code: warehouse.code,
      name: warehouse.name,
      status: warehouse.status as WarehouseStatus,
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt,
    });
  }
}
