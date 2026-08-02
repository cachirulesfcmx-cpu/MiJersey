import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  AnalyticsQueryRepositoryPort,
  CustomerInsights,
  SalesSummary,
  SalesTrendPoint,
  TopCustomer,
  TopProduct,
} from '../../domain/ports/analytics-query.repository.port';
import type { DateRange } from '../../domain/value-objects/date-range.util';

/** "Venta contada" = pedidos no cancelados/reembolsados con pago capturado (`paymentStatus = PAID`); el volumen de pedidos (`orders`) cuenta todo pedido no cancelado, sin importar el pago — ver `AnalyticsQueryRepositoryPort` para el razonamiento completo. Consulta directamente `orders`/`order_items`/`users` vía Prisma sin importar `OrdersModule` (mismo criterio "decoupled reference" que `CustomerOrderLookupPort`, 019). */
const REVENUE_WHERE = {
  paymentStatus: 'PAID',
  status: { notIn: ['CANCELLED', 'REFUNDED'] },
} satisfies Prisma.OrderWhereInput;

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class PrismaAnalyticsQueryRepository implements AnalyticsQueryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async countOrders(range: DateRange): Promise<number> {
    return this.prisma.order.count({
      where: {
        createdAt: { gte: range.from, lte: range.to },
        status: { not: 'CANCELLED' },
      },
    });
  }

  async getSalesSummary(range: DateRange): Promise<SalesSummary> {
    const [orderCount, revenueAggregate] = await Promise.all([
      this.countOrders(range),
      this.prisma.order.aggregate({
        where: { ...REVENUE_WHERE, createdAt: { gte: range.from, lte: range.to } },
        _sum: { grandTotal: true },
        _count: { _all: true },
      }),
    ]);

    const revenue = revenueAggregate._sum.grandTotal?.toNumber() ?? 0;
    const paidOrderCount = revenueAggregate._count._all;
    const currencyRow = await this.prisma.order.findFirst({
      where: { createdAt: { gte: range.from, lte: range.to } },
      select: { currency: true },
    });

    return {
      orderCount,
      revenue: revenue.toFixed(2),
      averageOrderValue: paidOrderCount > 0 ? (revenue / paidOrderCount).toFixed(2) : '0.00',
      currency: currencyRow?.currency ?? null,
    };
  }

  async getSalesTrend(range: DateRange): Promise<SalesTrendPoint[]> {
    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: range.from, lte: range.to }, status: { not: 'CANCELLED' } },
      select: { createdAt: true, grandTotal: true, paymentStatus: true, status: true },
    });

    const buckets = new Map<string, { orderCount: number; revenue: number }>();
    for (const order of orders) {
      const key = toDayKey(order.createdAt);
      const bucket = buckets.get(key) ?? { orderCount: 0, revenue: 0 };
      bucket.orderCount += 1;
      if (order.paymentStatus === 'PAID' && order.status !== 'REFUNDED') {
        bucket.revenue += order.grandTotal.toNumber();
      }
      buckets.set(key, bucket);
    }

    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, bucket]) => ({
        date,
        orderCount: bucket.orderCount,
        revenue: bucket.revenue.toFixed(2),
      }));
  }

  async getCustomerInsights(range: DateRange, limit: number): Promise<CustomerInsights> {
    const [firstOrderByCustomer, ordersInRange] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['customerId'],
        where: { customerId: { not: null } },
        _min: { createdAt: true },
      }),
      this.prisma.order.groupBy({
        by: ['customerId'],
        where: {
          customerId: { not: null },
          createdAt: { gte: range.from, lte: range.to },
          status: { not: 'CANCELLED' },
        },
        _count: { _all: true },
        _sum: { grandTotal: true },
        orderBy: { _sum: { grandTotal: 'desc' } },
        take: limit,
      }),
    ]);

    const firstOrderAt = new Map(
      firstOrderByCustomer.map((row) => [row.customerId as string, row._min.createdAt]),
    );

    let newCustomers = 0;
    let returningCustomers = 0;
    for (const [customerId, firstAt] of firstOrderAt) {
      if (!firstAt) continue;
      const isActiveInRange = ordersInRange.some((row) => row.customerId === customerId);
      if (firstAt >= range.from && firstAt <= range.to) newCustomers += 1;
      else if (isActiveInRange) returningCustomers += 1;
    }

    const customerIds = ordersInRange
      .map((row) => row.customerId)
      .filter((id): id is string => !!id);
    const users =
      customerIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: customerIds } },
            select: { id: true, email: true, firstName: true, lastName: true },
          })
        : [];
    const userById = new Map(users.map((user) => [user.id, user]));

    const topCustomers: TopCustomer[] = ordersInRange.map((row) => {
      const user = userById.get(row.customerId as string);
      return {
        customerId: row.customerId as string,
        email: user?.email ?? 'desconocido',
        name: user ? `${user.firstName} ${user.lastName}` : 'Cliente eliminado',
        orderCount: row._count._all,
        totalSpent: (row._sum.grandTotal?.toNumber() ?? 0).toFixed(2),
      };
    });

    return { newCustomers, returningCustomers, topCustomers };
  }

  async getTopProducts(range: DateRange, limit: number): Promise<TopProduct[]> {
    const orderIds = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: range.from, lte: range.to },
        status: { not: 'CANCELLED' },
      },
      select: { id: true },
    });

    if (orderIds.length === 0) return [];

    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { orderId: { in: orderIds.map((row) => row.id) } },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: limit,
    });

    const productIds = grouped.map((row) => row.productId);
    const products =
      productIds.length > 0
        ? await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, sku: true },
          })
        : [];
    const productById = new Map(products.map((product) => [product.id, product]));

    return grouped.map((row) => {
      const product = productById.get(row.productId);
      return {
        productId: row.productId,
        sku: product?.sku ?? row.productId,
        name: product?.name ?? 'Producto eliminado',
        unitsSold: row._sum.quantity ?? 0,
        revenue: (row._sum.subtotal?.toNumber() ?? 0).toFixed(2),
      };
    });
  }

  async countActiveProducts(): Promise<number> {
    return this.prisma.product.count({
      where: { status: 'ACTIVE', visibility: 'PUBLIC', deletedAt: null },
    });
  }
}
