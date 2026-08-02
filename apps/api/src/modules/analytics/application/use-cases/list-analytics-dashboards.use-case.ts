import { Inject, Injectable } from '@nestjs/common';

import { ANALYTICS_DASHBOARD_REPOSITORY } from '../../analytics.constants';
import type { AnalyticsDashboardEntity } from '../../domain/entities/analytics-dashboard.entity';
import type { AnalyticsDashboardRepositoryPort } from '../../domain/ports/analytics-dashboard.repository.port';

@Injectable()
export class ListAnalyticsDashboardsUseCase {
  constructor(
    @Inject(ANALYTICS_DASHBOARD_REPOSITORY)
    private readonly dashboards: AnalyticsDashboardRepositoryPort,
  ) {}

  async execute(): Promise<AnalyticsDashboardEntity[]> {
    return this.dashboards.findMany();
  }
}
