import type { DateRange } from '../value-objects/date-range.util';

export interface SalesSummary {
  orderCount: number;
  revenue: string;
  averageOrderValue: string;
  currency: string | null;
}

export interface SalesTrendPoint {
  date: string;
  orderCount: number;
  revenue: string;
}

export interface TopCustomer {
  customerId: string;
  email: string;
  name: string;
  orderCount: number;
  totalSpent: string;
}

export interface CustomerInsights {
  newCustomers: number;
  returningCustomers: number;
  topCustomers: TopCustomer[];
}

export interface TopProduct {
  productId: string;
  sku: string;
  name: string;
  unitsSold: number;
  revenue: string;
}

/** Puerto de solo lectura sobre tablas de otros módulos (Order/OrderItem/User) — mismo criterio "decoupled reference" que `CustomerOrderLookupPort` (019): Analytics consulta directamente vía Prisma sin importar `OrdersModule`, para no acoplar un módulo de negocio a uno de reportes. */
export interface AnalyticsQueryRepositoryPort {
  /** "Venta contada" = pedidos no cancelados con pago capturado (`status != CANCELLED`, `paymentStatus = PAID`) — volumen de pedidos (`orders` en el dashboard ejecutivo) en cambio cuenta todo pedido no cancelado, sin importar el estado de pago. */
  getSalesSummary(range: DateRange): Promise<SalesSummary>;
  getSalesTrend(range: DateRange): Promise<SalesTrendPoint[]>;
  getCustomerInsights(range: DateRange, limit: number): Promise<CustomerInsights>;
  getTopProducts(range: DateRange, limit: number): Promise<TopProduct[]>;
  countActiveProducts(): Promise<number>;
  countOrders(range: DateRange): Promise<number>;
}
