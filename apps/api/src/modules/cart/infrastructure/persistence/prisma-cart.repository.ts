import { Injectable } from '@nestjs/common';
import type { Cart as PrismaCart, CartItem as PrismaCartItem } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { CartEntity } from '../../domain/entities/cart.entity';
import { CartItemEntity } from '../../domain/entities/cart-item.entity';
import type { CartRepositoryPort, CreateCartData } from '../../domain/ports/cart.repository.port';
import type { CartStatus } from '../../domain/value-objects/cart-enums';

type PrismaCartWithItems = PrismaCart & { items: PrismaCartItem[] };

function toItemEntity(row: PrismaCartItem): CartItemEntity {
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

function toEntity(row: PrismaCartWithItems): CartEntity {
  return new CartEntity({
    id: row.id,
    customerId: row.customerId,
    sessionId: row.sessionId,
    currency: row.currency,
    status: row.status as CartStatus,
    couponCode: row.couponCode,
    items: row.items.map(toItemEntity),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaCartRepository implements CartRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CartEntity | null> {
    const row = await this.prisma.cart.findUnique({ where: { id }, include: { items: true } });
    return row ? toEntity(row) : null;
  }

  async findActiveBySessionId(sessionId: string): Promise<CartEntity | null> {
    const row = await this.prisma.cart.findFirst({
      where: { sessionId, status: 'ACTIVE' },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return row ? toEntity(row) : null;
  }

  async findActiveByCustomerId(customerId: string): Promise<CartEntity | null> {
    const row = await this.prisma.cart.findFirst({
      where: { customerId, status: 'ACTIVE' },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return row ? toEntity(row) : null;
  }

  async create(data: CreateCartData): Promise<CartEntity> {
    const row = await this.prisma.cart.create({
      data: {
        sessionId: data.sessionId,
        customerId: data.customerId ?? null,
        currency: data.currency,
      },
      include: { items: true },
    });
    return toEntity(row);
  }

  async attachCustomer(id: string, customerId: string): Promise<CartEntity> {
    const row = await this.prisma.cart.update({
      where: { id },
      data: { customerId },
      include: { items: true },
    });
    return toEntity(row);
  }

  async updateStatus(id: string, status: CartStatus): Promise<CartEntity> {
    const row = await this.prisma.cart.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
    return toEntity(row);
  }

  async setCoupon(id: string, couponCode: string | null): Promise<CartEntity> {
    const row = await this.prisma.cart.update({
      where: { id },
      data: { couponCode },
      include: { items: true },
    });
    return toEntity(row);
  }
}
