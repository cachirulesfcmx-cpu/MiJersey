import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { AUDIT_LOG_QUERY_REPOSITORY } from './administration.constants';
import { GetDashboardMetricsUseCase } from './application/use-cases/get-dashboard-metrics.use-case';
import { GetRecentActivityUseCase } from './application/use-cases/get-recent-activity.use-case';
import { QueryAuditLogUseCase } from './application/use-cases/query-audit-log.use-case';
import { PrismaAuditLogQueryRepository } from './infrastructure/persistence/prisma-audit-log-query.repository';
import { AuditLogController } from './presentation/controllers/audit-log.controller';
import { DashboardController } from './presentation/controllers/dashboard.controller';

@Module({
  imports: [IdentityModule],
  controllers: [DashboardController, AuditLogController],
  providers: [
    GetDashboardMetricsUseCase,
    GetRecentActivityUseCase,
    QueryAuditLogUseCase,
    { provide: AUDIT_LOG_QUERY_REPOSITORY, useClass: PrismaAuditLogQueryRepository },
  ],
})
export class AdministrationModule {}
