import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type { WishlistInventoryAvailabilityPort } from '../../domain/ports/wishlist-inventory-availability.port';

@Injectable()
export class PrismaWishlistInventoryAvailabilityRepository implements WishlistInventoryAvailabilityPort {
  constructor(private readonly prisma: PrismaService) {}

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
