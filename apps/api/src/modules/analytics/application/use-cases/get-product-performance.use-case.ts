import { Inject, Injectable } from '@nestjs/common';

import { ANALYTICS_QUERY_REPOSITORY } from '../../analytics.constants';
import type {
  AnalyticsQueryRepositoryPort,
  TopProduct,
} from '../../domain/ports/analytics-query.repository.port';
import type { DateRangeInput } from '../../domain/value-objects/date-range.util';
import { resolveDateRange } from '../../domain/value-objects/date-range.util';

export interface GetProductPerformanceInput extends DateRangeInput {
  limit?: number;
}

/** `GET /admin/analytics/products` (spec §7) — productos más vendidos por ingreso/unidades en el rango (spec §6 "Product Performance"). */
@Injectable()
export class GetProductPerformanceUseCase {
  constructor(
    @Inject(ANALYTICS_QUERY_REPOSITORY) private readonly queries: AnalyticsQueryRepositoryPort,
  ) {}

  async execute(input: GetProductPerformanceInput): Promise<TopProduct[]> {
    const range = resolveDateRange(input);
    return this.queries.getTopProducts(range, input.limit ?? 20);
  }
}
