import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type { Order as PrismaOrder, OrderItem as PrismaOrderItem } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderItemEntity } from '../../domain/entities/order-item.entity';
import type {
  ListAllOrdersParams,
  OrderRepositoryPort,
  OrderSummaryView,
} from '../../domain/ports/order.repository.port';
import type {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
} from '../../domain/value-objects/order-enums';

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

function toSummaryView(row: PrismaOrder & { _count: { items: number } }): OrderSummaryView {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    paymentStatus: row.paymentStatus,
    fulfillmentStatus: row.fulfillmentStatus,
    currency: row.currency,
    grandTotal: row.grandTotal.toNumber(),
    itemCount: row._count.items,
    createdAt: row.createdAt,
  };
}

@Injectable()
export class PrismaOrderRepository implements OrderRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<OrderEntity | null> {
    const row = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    return row ? toEntity(row) : null;
  }

  async findByCustomerId(
    customerId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<OrderSummaryView>> {
    const skip = (params.page - 1) * params.pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: params.pageSize,
        include: { _count: { select: { items: true } } },
      }),
      this.prisma.order.count({ where: { customerId } }),
    ]);

    return {
      items: rows.map(toSummaryView),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }

  async findAll(params: ListAllOrdersParams): Promise<PaginatedResult<OrderSummaryView>> {
    const skip = (params.page - 1) * params.pageSize;
    const where = params.status ? { status: params.status as OrderStatus } : {};

    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: params.pageSize,
        include: { _count: { select: { items: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: rows.map(toSummaryView),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }

  async cancel(id: string, reason: string | null): Promise<OrderEntity> {
    const row = await this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason },
      include: { items: true },
    });
    return toEntity(row);
  }

  async updateField(
    id: string,
    field: 'paymentStatus' | 'fulfillmentStatus',
    value: string,
  ): Promise<OrderEntity> {
    // Sin consumidores todavía (ver UpdateOrderStatusUseCase) — el cast es deliberado, Prisma
    // valida el valor real contra el enum de la columna en tiempo de ejecución.
    const row = await this.prisma.order.update({
      where: { id },
      data: { [field]: value } as never,
      include: { items: true },
    });
    return toEntity(row);
  }
}
