import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type { InventoryAvailabilityPort } from '../../domain/ports/inventory-availability.port';

@Injectable()
export class PrismaInventoryAvailabilityRepository implements InventoryAvailabilityPort {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailability(variantIds: string[]): Promise<Map<string, number>> {
    if (variantIds.length === 0) return new Map();

    const grouped = await this.prisma.inventoryItem.groupBy({
      by: ['variantId'],
      where: { variantId: { in: variantIds } },
      _sum: { availableQuantity: true },
    });

    return new Map(grouped.map((row) => [row.variantId, row._sum.availableQuantity ?? 0]));
  }
}
