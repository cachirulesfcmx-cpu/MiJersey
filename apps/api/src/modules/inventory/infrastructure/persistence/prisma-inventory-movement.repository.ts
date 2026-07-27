import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  InventoryMovementRepositoryPort,
  ListMovementsParams,
  ListMovementsResult,
} from '../../domain/ports/inventory-movement.repository.port';
import { toMovementEntity } from './inventory-movement.mapper';

@Injectable()
export class PrismaInventoryMovementRepository implements InventoryMovementRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(params: ListMovementsParams): Promise<ListMovementsResult> {
    const { filter, page, pageSize } = params;

    const where: Prisma.InventoryMovementWhereInput = {
      ...(filter?.inventoryItemId ? { inventoryItemId: filter.inventoryItemId } : {}),
      ...(filter?.type ? { type: filter.type } : {}),
      ...(filter?.referenceType ? { referenceType: filter.referenceType } : {}),
      ...(filter?.referenceId ? { referenceId: filter.referenceId } : {}),
      ...(filter?.variantId || filter?.warehouseId
        ? {
            inventoryItem: {
              ...(filter.variantId ? { variantId: filter.variantId } : {}),
              ...(filter.warehouseId ? { warehouseId: filter.warehouseId } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return { items: items.map((movement) => toMovementEntity(movement)), total };
  }
}
