import { Injectable } from '@nestjs/common';
import type { CheckoutSession as PrismaCheckoutSession } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { CheckoutSessionEntity } from '../../domain/entities/checkout-session.entity';
import type {
  CheckoutSessionRepositoryPort,
  CreateCheckoutSessionData,
  UpdateCheckoutSessionData,
} from '../../domain/ports/checkout-session.repository.port';
import type { CheckoutStatus } from '../../domain/value-objects/checkout-enums';

function toEntity(row: PrismaCheckoutSession): CheckoutSessionEntity {
  return new CheckoutSessionEntity({
    id: row.id,
    cartId: row.cartId,
    customerId: row.customerId,
    sessionId: row.sessionId,
    contactEmail: row.contactEmail,
    shippingAddressId: row.shippingAddressId,
    billingAddressId: row.billingAddressId,
    shippingMethodId: row.shippingMethodId,
    status: row.status as CheckoutStatus,
    orderId: row.orderId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaCheckoutSessionRepository implements CheckoutSessionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CheckoutSessionEntity | null> {
    const row = await this.prisma.checkoutSession.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByCartId(cartId: string): Promise<CheckoutSessionEntity | null> {
    const row = await this.prisma.checkoutSession.findUnique({ where: { cartId } });
    return row ? toEntity(row) : null;
  }

  async create(data: CreateCheckoutSessionData): Promise<CheckoutSessionEntity> {
    const row = await this.prisma.checkoutSession.create({
      data: { cartId: data.cartId, customerId: data.customerId, sessionId: data.sessionId },
    });
    return toEntity(row);
  }

  async update(id: string, data: UpdateCheckoutSessionData): Promise<CheckoutSessionEntity> {
    const row = await this.prisma.checkoutSession.update({ where: { id }, data });
    return toEntity(row);
  }
}
