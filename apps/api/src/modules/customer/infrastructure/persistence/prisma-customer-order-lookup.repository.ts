import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  CustomerOrderDetailView,
  CustomerOrderLookupPort,
  CustomerOrderSummaryView,
} from '../../domain/ports/customer-order-lookup.port';

@Injectable()
export class PrismaCustomerOrderLookupRepository implements CustomerOrderLookupPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByCustomerId(
    customerId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<CustomerOrderSummaryView>> {
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

    const items: CustomerOrderSummaryView[] = rows.map((row) => ({
      id: row.id,
      orderNumber: row.orderNumber,
      status: row.status,
      paymentStatus: row.paymentStatus,
      fulfillmentStatus: row.fulfillmentStatus,
      currency: row.currency,
      grandTotal: row.grandTotal.toNumber(),
      itemCount: row._count.items,
      createdAt: row.createdAt,
    }));

    return {
      items,
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }

  async findById(id: string): Promise<CustomerOrderDetailView | null> {
    const row = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!row) return null;

    return {
      id: row.id,
      orderNumber: row.orderNumber,
      customerId: row.customerId,
      status: row.status,
      paymentStatus: row.paymentStatus,
      fulfillmentStatus: row.fulfillmentStatus,
      currency: row.currency,
      subtotal: row.subtotal.toNumber(),
      discountTotal: row.discountTotal.toNumber(),
      shippingTotal: row.shippingTotal.toNumber(),
      taxTotal: row.taxTotal.toNumber(),
      grandTotal: row.grandTotal.toNumber(),
      itemCount: row.items.length,
      items: row.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        subtotal: item.subtotal.toNumber(),
      })),
      createdAt: row.createdAt,
    };
  }
}
