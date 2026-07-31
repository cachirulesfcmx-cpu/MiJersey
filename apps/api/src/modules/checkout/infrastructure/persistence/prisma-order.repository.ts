import { Injectable } from '@nestjs/common';
import type { Order as PrismaOrder, OrderItem as PrismaOrderItem } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderItemEntity } from '../../domain/entities/order-item.entity';
import type {
  CreateOrderData,
  OrderRepositoryPort,
} from '../../domain/ports/order.repository.port';
import type {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
} from '../../domain/value-objects/checkout-enums';

type PrismaOrderWithItems = PrismaOrder & { items: PrismaOrderItem[] };

function toItemEntity(row: PrismaOrderItem): OrderItemEntity {
  return new OrderItemEntity({
    id: row.id,
    orderId: row.orderId,
    productId: row.productId,
    variantId: row.variantId,
    sku: row.sku,
    quantity: row.quantity,
    unitPrice: row.unitPrice.toNumber(),
    subtotal: row.subtotal.toNumber(),
  });
}

function toEntity(row: PrismaOrderWithItems): OrderEntity {
  return new OrderEntity({
    id: row.id,
    orderNumber: row.orderNumber,
    customerId: row.customerId,
    contactEmail: row.contactEmail,
    status: row.status as OrderStatus,
    paymentStatus: row.paymentStatus as PaymentStatus,
    fulfillmentStatus: row.fulfillmentStatus as FulfillmentStatus,
    currency: row.currency,
    subtotal: row.subtotal.toNumber(),
    discountTotal: row.discountTotal.toNumber(),
    shippingTotal: row.shippingTotal.toNumber(),
    taxTotal: row.taxTotal.toNumber(),
    grandTotal: row.grandTotal.toNumber(),
    couponCode: row.couponCode,
    shippingAddressId: row.shippingAddressId,
    billingAddressId: row.billingAddressId,
    shippingMethodId: row.shippingMethodId,
    cancelledAt: row.cancelledAt,
    cancelReason: row.cancelReason,
    items: row.items.map(toItemEntity),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaOrderRepository implements OrderRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<OrderEntity | null> {
    const row = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    return row ? toEntity(row) : null;
  }

  async create(data: CreateOrderData): Promise<OrderEntity> {
    const row = await this.prisma.order.create({
      data: {
        orderNumber: data.orderNumber,
        customerId: data.customerId,
        contactEmail: data.contactEmail,
        currency: data.currency,
        subtotal: data.subtotal,
        discountTotal: data.discountTotal,
        shippingTotal: data.shippingTotal,
        taxTotal: data.taxTotal,
        grandTotal: data.grandTotal,
        couponCode: data.couponCode,
        shippingAddressId: data.shippingAddressId,
        billingAddressId: data.billingAddressId,
        shippingMethodId: data.shippingMethodId,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        },
      },
      include: { items: true },
    });
    return toEntity(row);
  }
}
