import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { ANALYTICS_DASHBOARD_REPOSITORY } from '../../analytics.constants';
import type { AnalyticsDashboardEntity } from '../../domain/entities/analytics-dashboard.entity';
import type {
  AnalyticsDashboardRepositoryPort,
  UpsertAnalyticsDashboardData,
} from '../../domain/ports/analytics-dashboard.repository.port';

export interface CreateAnalyticsDashboardInput extends UpsertAnalyticsDashboardData {
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateAnalyticsDashboardUseCase {
  constructor(
    @Inject(ANALYTICS_DASHBOARD_REPOSITORY)
    private readonly dashboards: AnalyticsDashboardRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateAnalyticsDashboardInput): Promise<AnalyticsDashboardEntity> {
    const { actorUserId, ipAddress, ...data } = input;
    const dashboard = await this.dashboards.create(data);

    await this.auditLog.record({
      userId: actorUserId,
      action: 'analytics.dashboard_created',
      ipAddress,
      metadata: { dashboardId: dashboard.id, name: data.name },
    });

    return dashboard;
  }
}
