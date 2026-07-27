import { Injectable } from '@nestjs/common';
import type { InventoryItem as PrismaInventoryItem, Prisma } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { InventoryItemEntity } from '../../domain/entities/inventory-item.entity';
import type {
  ApplyMovementInput,
  ApplyMovementResult,
  InventoryItemRepositoryPort,
  ListInventoryParams,
  ListInventoryResult,
} from '../../domain/ports/inventory-item.repository.port';
import { toMovementEntity } from './inventory-movement.mapper';

@Injectable()
export class PrismaInventoryItemRepository implements InventoryItemRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<InventoryItemEntity | null> {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    return item ? this.toEntity(item) : null;
  }

  async findByVariantAndWarehouse(
    variantId: string,
    warehouseId: string,
  ): Promise<InventoryItemEntity | null> {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { variantId_warehouseId: { variantId, warehouseId } },
    });
    return item ? this.toEntity(item) : null;
  }

  async findByVariant(variantId: string): Promise<InventoryItemEntity[]> {
    const items = await this.prisma.inventoryItem.findMany({
      where: { variantId },
      include: { warehouse: true },
      orderBy: { warehouse: { name: 'asc' } },
    });
    return items.map((item) => this.toEntity(item));
  }

  async findMany(params: ListInventoryParams): Promise<ListInventoryResult> {
    const { filter, page, pageSize } = params;

    const where: Prisma.InventoryItemWhereInput = {
      ...(filter?.variantId ? { variantId: filter.variantId } : {}),
      ...(filter?.warehouseId ? { warehouseId: filter.warehouseId } : {}),
      ...(filter?.variantIds ? { variantId: { in: filter.variantIds } } : {}),
    };

    if (filter?.belowSafetyStock) {
      // Prisma no compara dos columnas directamente en `where`; se filtra con SQL crudo del subconjunto de ids.
      const candidates = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM inventory_items WHERE "availableQuantity" < "safetyStock"
      `;
      const ids = candidates.map((row) => row.id);
      where.id = { in: ids };
    }

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return { items: items.map((item) => this.toEntity(item)), total };
  }

  async findOrCreate(variantId: string, warehouseId: string): Promise<InventoryItemEntity> {
    const existing = await this.findByVariantAndWarehouse(variantId, warehouseId);
    if (existing) return existing;

    const item = await this.prisma.inventoryItem.create({ data: { variantId, warehouseId } });
    return this.toEntity(item);
  }

  async updateSafetyStock(id: string, safetyStock: number): Promise<InventoryItemEntity> {
    const item = await this.prisma.inventoryItem.update({ where: { id }, data: { safetyStock } });
    return this.toEntity(item);
  }

  async applyMovement(input: ApplyMovementInput): Promise<ApplyMovementResult | null> {
    return this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.inventoryItem.updateMany({
        where: { id: input.itemId, version: input.version },
        data: {
          ...(input.delta.availableDelta
            ? { availableQuantity: { increment: input.delta.availableDelta } }
            : {}),
          ...(input.delta.reservedDelta
            ? { reservedQuantity: { increment: input.delta.reservedDelta } }
            : {}),
          ...(input.delta.incomingDelta
            ? { incomingQuantity: { increment: input.delta.incomingDelta } }
            : {}),
          ...(input.delta.safetyStock !== undefined
            ? { safetyStock: input.delta.safetyStock }
            : {}),
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        return null;
      }

      const item = await tx.inventoryItem.findUniqueOrThrow({ where: { id: input.itemId } });
      const movement = await tx.inventoryMovement.create({
        data: {
          inventoryItemId: input.itemId,
          type: input.movement.type,
          quantity: input.movement.quantity,
          reason: input.movement.reason,
          referenceType: input.movement.referenceType,
          referenceId: input.movement.referenceId,
          createdBy: input.movement.createdBy,
        },
      });

      return { item: this.toEntity(item), movement: toMovementEntity(movement) };
    });
  }

  private toEntity(item: PrismaInventoryItem): InventoryItemEntity {
    return new InventoryItemEntity({
      id: item.id,
      variantId: item.variantId,
      warehouseId: item.warehouseId,
      availableQuantity: item.availableQuantity,
      reservedQuantity: item.reservedQuantity,
      incomingQuantity: item.incomingQuantity,
      safetyStock: item.safetyStock,
      version: item.version,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  }
}
