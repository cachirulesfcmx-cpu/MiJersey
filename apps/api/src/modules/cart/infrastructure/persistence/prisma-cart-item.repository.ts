import { Injectable } from '@nestjs/common';
import type { CartItem as PrismaCartItem } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { CartItemEntity } from '../../domain/entities/cart-item.entity';
import type {
  CartItemRepositoryPort,
  CreateCartItemData,
  UpdateCartItemData,
} from '../../domain/ports/cart-item.repository.port';

function toEntity(row: PrismaCartItem): CartItemEntity {
  return new CartItemEntity({
    id: row.id,
    cartId: row.cartId,
    productId: row.productId,
    variantId: row.variantId,
    sku: row.sku,
    quantity: row.quantity,
    unitPrice: row.unitPrice.toNumber(),
    subtotal: row.subtotal.toNumber(),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaCartItemRepository implements CartItemRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CartItemEntity | null> {
    const row = await this.prisma.cartItem.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByCartId(cartId: string): Promise<CartItemEntity[]> {
    const rows = await this.prisma.cartItem.findMany({ where: { cartId } });
    return rows.map(toEntity);
  }

  async findByCartAndVariant(cartId: string, variantId: string): Promise<CartItemEntity | null> {
    const row = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId, variantId } },
    });
    return row ? toEntity(row) : null;
  }

  async create(data: CreateCartItemData): Promise<CartItemEntity> {
    const row = await this.prisma.cartItem.create({ data });
    return toEntity(row);
  }

  async update(id: string, data: UpdateCartItemData): Promise<CartItemEntity> {
    const row = await this.prisma.cartItem.update({ where: { id }, data });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.cartItem.delete({ where: { id } });
  }
}
