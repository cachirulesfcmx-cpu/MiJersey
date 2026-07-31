import { Injectable } from '@nestjs/common';
import type {
  Wishlist as PrismaWishlist,
  WishlistItem as PrismaWishlistItem,
} from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { WishlistEntity } from '../../domain/entities/wishlist.entity';
import { WishlistItemEntity } from '../../domain/entities/wishlist-item.entity';
import type {
  CreateWishlistData,
  WishlistRepositoryPort,
} from '../../domain/ports/wishlist.repository.port';

type PrismaWishlistWithItems = PrismaWishlist & { items: PrismaWishlistItem[] };

function toItemEntity(row: PrismaWishlistItem): WishlistItemEntity {
  return new WishlistItemEntity({
    id: row.id,
    wishlistId: row.wishlistId,
    productId: row.productId,
    variantId: row.variantId,
    createdAt: row.createdAt,
  });
}

function toEntity(row: PrismaWishlistWithItems): WishlistEntity {
  return new WishlistEntity({
    id: row.id,
    customerId: row.customerId,
    name: row.name,
    isDefault: row.isDefault,
    shareToken: row.shareToken,
    items: row.items.map(toItemEntity),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaWishlistRepository implements WishlistRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<WishlistEntity | null> {
    const row = await this.prisma.wishlist.findUnique({ where: { id }, include: { items: true } });
    return row ? toEntity(row) : null;
  }

  async findDefaultByCustomerId(customerId: string): Promise<WishlistEntity | null> {
    const row = await this.prisma.wishlist.findFirst({
      where: { customerId, isDefault: true },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });
    return row ? toEntity(row) : null;
  }

  async findByShareToken(token: string): Promise<WishlistEntity | null> {
    const row = await this.prisma.wishlist.findUnique({
      where: { shareToken: token },
      include: { items: true },
    });
    return row ? toEntity(row) : null;
  }

  async create(data: CreateWishlistData): Promise<WishlistEntity> {
    const row = await this.prisma.wishlist.create({
      data: {
        customerId: data.customerId,
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
      },
      include: { items: true },
    });
    return toEntity(row);
  }

  async setShareToken(id: string, token: string): Promise<WishlistEntity> {
    const row = await this.prisma.wishlist.update({
      where: { id },
      data: { shareToken: token },
      include: { items: true },
    });
    return toEntity(row);
  }
}
