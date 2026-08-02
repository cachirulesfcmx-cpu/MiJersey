import { Inject, Injectable } from '@nestjs/common';

import { ANALYTICS_QUERY_REPOSITORY, analyticsCacheKey } from '../../analytics.constants';
import type {
  AnalyticsQueryRepositoryPort,
  SalesSummary,
  SalesTrendPoint,
} from '../../domain/ports/analytics-query.repository.port';
import type { DateRangeInput } from '../../domain/value-objects/date-range.util';
import { dateRangeCacheParams, resolveDateRange } from '../../domain/value-objects/date-range.util';
import { AnalyticsCacheService } from '../services/analytics-cache.service';

export interface SalesReportView {
  range: { from: string; to: string };
  summary: SalesSummary;
  trend: SalesTrendPoint[];
}

/** `GET /admin/analytics/sales` (spec §7) — resumen + serie diaria de ventas para el rango pedido (spec §6 "Sales Reports"). */
@Injectable()
export class GetSalesReportUseCase {
  constructor(
    @Inject(ANALYTICS_QUERY_REPOSITORY) private readonly queries: AnalyticsQueryRepositoryPort,
    private readonly cache: AnalyticsCacheService,
  ) {}

  async execute(input: DateRangeInput): Promise<SalesReportView> {
    const range = resolveDateRange(input);
    const cacheKey = analyticsCacheKey('sales', dateRangeCacheParams(range));

    const cached = await this.cache.get(cacheKey);
    if (cached) return JSON.parse(cached) as SalesReportView;

    const [summary, trend] = await Promise.all([
      this.queries.getSalesSummary(range),
      this.queries.getSalesTrend(range),
    ]);

    const view: SalesReportView = {
      range: { from: range.from.toISOString(), to: range.to.toISOString() },
      summary,
      trend,
    };

    await this.cache.set(cacheKey, JSON.stringify(view));
    return view;
  }
}
