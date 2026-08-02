import { Inject, Injectable } from '@nestjs/common';

import { ANALYTICS_QUERY_REPOSITORY, analyticsCacheKey } from '../../analytics.constants';
import type { AnalyticsQueryRepositoryPort } from '../../domain/ports/analytics-query.repository.port';
import type { DateRangeInput } from '../../domain/value-objects/date-range.util';
import { dateRangeCacheParams, resolveDateRange } from '../../domain/value-objects/date-range.util';
import { AnalyticsCacheService } from '../services/analytics-cache.service';

export interface ExecutiveDashboardView {
  range: { from: string; to: string };
  orderCount: number;
  revenue: string;
  averageOrderValue: string;
  currency: string | null;
  newCustomers: number;
  activeProducts: number;
  topProducts: Array<{
    productId: string;
    sku: string;
    name: string;
    unitsSold: number;
    revenue: string;
  }>;
}

/** `GET /admin/analytics/dashboard` (spec §7) — combina ventas, clientes nuevos, catálogo activo y los productos más vendidos del rango en un solo resumen ejecutivo (spec §6 "Executive Dashboard" + "KPI Cards"). Cacheado con TTL (spec §8) porque es la consulta más costosa del módulo. */
@Injectable()
export class GetExecutiveDashboardUseCase {
  constructor(
    @Inject(ANALYTICS_QUERY_REPOSITORY) private readonly queries: AnalyticsQueryRepositoryPort,
    private readonly cache: AnalyticsCacheService,
  ) {}

  async execute(input: DateRangeInput): Promise<ExecutiveDashboardView> {
    const range = resolveDateRange(input);
    const cacheKey = analyticsCacheKey('dashboard', dateRangeCacheParams(range));

    const cached = await this.cache.get(cacheKey);
    if (cached) return JSON.parse(cached) as ExecutiveDashboardView;

    const [summary, customerInsights, activeProducts, topProducts] = await Promise.all([
      this.queries.getSalesSummary(range),
      this.queries.getCustomerInsights(range, 1),
      this.queries.countActiveProducts(),
      this.queries.getTopProducts(range, 5),
    ]);

    const view: ExecutiveDashboardView = {
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      orderCount: summary.orderCount,
      revenue: summary.revenue,
      averageOrderValue: summary.averageOrderValue,
      currency: summary.currency,
      newCustomers: customerInsights.newCustomers,
      activeProducts,
      topProducts,
    };

    await this.cache.set(cacheKey, JSON.stringify(view));
    return view;
  }
}
