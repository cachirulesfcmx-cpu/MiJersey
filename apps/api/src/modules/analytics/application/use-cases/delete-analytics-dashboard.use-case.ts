import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { ANALYTICS_DASHBOARD_REPOSITORY } from '../../analytics.constants';
import { AnalyticsDashboardNotFoundError } from '../../domain/errors/analytics.errors';
import type { AnalyticsDashboardRepositoryPort } from '../../domain/ports/analytics-dashboard.repository.port';

export interface DeleteAnalyticsDashboardInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteAnalyticsDashboardUseCase {
  constructor(
    @Inject(ANALYTICS_DASHBOARD_REPOSITORY)
    private readonly dashboards: AnalyticsDashboardRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteAnalyticsDashboardInput): Promise<void> {
    const existing = await this.dashboards.findById(input.id);
    if (!existing) throw new AnalyticsDashboardNotFoundError();

    await this.dashboards.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'analytics.dashboard_deleted',
      ipAddress: input.ipAddress,
      metadata: { dashboardId: input.id },
    });
  }
}
