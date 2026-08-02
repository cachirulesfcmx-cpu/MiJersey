import { Inject, Injectable } from '@nestjs/common';

import { ANALYTICS_QUERY_REPOSITORY } from '../../analytics.constants';
import type {
  AnalyticsQueryRepositoryPort,
  CustomerInsights,
} from '../../domain/ports/analytics-query.repository.port';
import type { DateRangeInput } from '../../domain/value-objects/date-range.util';
import { resolveDateRange } from '../../domain/value-objects/date-range.util';

export interface GetCustomerInsightsInput extends DateRangeInput {
  limit?: number;
}

/** `GET /admin/analytics/customers` (spec §7) — nuevos vs. recurrentes + top clientes por gasto en el rango (spec §6 "Customer Insights"). Sin caché propia: se consulta con menos frecuencia que el dashboard/ventas y su costo es comparable. */
@Injectable()
export class GetCustomerInsightsUseCase {
  constructor(
    @Inject(ANALYTICS_QUERY_REPOSITORY) private readonly queries: AnalyticsQueryRepositoryPort,
  ) {}

  async execute(input: GetCustomerInsightsInput): Promise<CustomerInsights> {
    const range = resolveDateRange(input);
    return this.queries.getCustomerInsights(range, input.limit ?? 10);
  }
}
