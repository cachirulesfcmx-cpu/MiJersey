import { Inject, Injectable } from '@nestjs/common';

import { ANALYTICS_DASHBOARD_REPOSITORY } from '../../analytics.constants';
import type { AnalyticsDashboardEntity } from '../../domain/entities/analytics-dashboard.entity';
import { AnalyticsDashboardNotFoundError } from '../../domain/errors/analytics.errors';
import type { AnalyticsDashboardRepositoryPort } from '../../domain/ports/analytics-dashboard.repository.port';

@Injectable()
export class GetAnalyticsDashboardUseCase {
  constructor(
    @Inject(ANALYTICS_DASHBOARD_REPOSITORY)
    private readonly dashboards: AnalyticsDashboardRepositoryPort,
  ) {}

  async execute(id: string): Promise<AnalyticsDashboardEntity> {
    const dashboard = await this.dashboards.findById(id);
    if (!dashboard) throw new AnalyticsDashboardNotFoundError();
    return dashboard;
  }
}
