import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type { CartInventoryAvailabilityPort } from '../../domain/ports/cart-inventory-availability.port';

@Injectable()
export class PrismaCartInventoryAvailabilityRepository implements CartInventoryAvailabilityPort {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailability(variantId: string): Promise<number> {
    const map = await this.getAvailabilityMany([variantId]);
    return map.get(variantId) ?? 0;
  }

  async getAvailabilityMany(variantIds: string[]): Promise<Map<string, number>> {
    if (variantIds.length === 0) return new Map();

    const grouped = await this.prisma.inventoryItem.groupBy({
      by: ['variantId'],
      where: { variantId: { in: variantIds } },
      _sum: { availableQuantity: true },
    });

    return new Map(grouped.map((row) => [row.variantId, row._sum.availableQuantity ?? 0]));
  }
}
