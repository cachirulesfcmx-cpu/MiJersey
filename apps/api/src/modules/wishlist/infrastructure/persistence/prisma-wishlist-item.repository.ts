import { Injectable } from '@nestjs/common';
import type { WishlistItem as PrismaWishlistItem } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { WishlistItemEntity } from '../../domain/entities/wishlist-item.entity';
import type {
  CreateWishlistItemData,
  WishlistItemRepositoryPort,
} from '../../domain/ports/wishlist-item.repository.port';

function toEntity(row: PrismaWishlistItem): WishlistItemEntity {
  return new WishlistItemEntity({
    id: row.id,
    wishlistId: row.wishlistId,
    productId: row.productId,
    variantId: row.variantId,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class PrismaWishlistItemRepository implements WishlistItemRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<WishlistItemEntity | null> {
    const row = await this.prisma.wishlistItem.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByWishlistAndVariant(
    wishlistId: string,
    variantId: string,
  ): Promise<WishlistItemEntity | null> {
    const row = await this.prisma.wishlistItem.findUnique({
      where: { wishlistId_variantId: { wishlistId, variantId } },
    });
    return row ? toEntity(row) : null;
  }

  async create(data: CreateWishlistItemData): Promise<WishlistItemEntity> {
    const row = await this.prisma.wishlistItem.create({ data });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.wishlistItem.delete({ where: { id } });
  }
}
