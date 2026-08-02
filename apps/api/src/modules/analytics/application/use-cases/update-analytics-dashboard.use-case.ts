import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { ANALYTICS_DASHBOARD_REPOSITORY } from '../../analytics.constants';
import type { AnalyticsDashboardEntity } from '../../domain/entities/analytics-dashboard.entity';
import { AnalyticsDashboardNotFoundError } from '../../domain/errors/analytics.errors';
import type {
  AnalyticsDashboardRepositoryPort,
  UpsertAnalyticsDashboardData,
} from '../../domain/ports/analytics-dashboard.repository.port';

export interface UpdateAnalyticsDashboardInput extends Partial<UpsertAnalyticsDashboardData> {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateAnalyticsDashboardUseCase {
  constructor(
    @Inject(ANALYTICS_DASHBOARD_REPOSITORY)
    private readonly dashboards: AnalyticsDashboardRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateAnalyticsDashboardInput): Promise<AnalyticsDashboardEntity> {
    const existing = await this.dashboards.findById(input.id);
    if (!existing) throw new AnalyticsDashboardNotFoundError();

    const { id, actorUserId, ipAddress, ...data } = input;
    const updated = await this.dashboards.update(id, data);

    await this.auditLog.record({
      userId: actorUserId,
      action: 'analytics.dashboard_updated',
      ipAddress,
      metadata: { dashboardId: id, updatedFields: Object.keys(data) },
    });

    return updated;
  }
}
