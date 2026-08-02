import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import {
  ANALYTICS_DASHBOARD_REPOSITORY,
  ANALYTICS_EVENT_REPOSITORY,
  ANALYTICS_QUERY_REPOSITORY,
} from './analytics.constants';
import { AnalyticsCacheService } from './application/services/analytics-cache.service';
import { CreateAnalyticsDashboardUseCase } from './application/use-cases/create-analytics-dashboard.use-case';
import { DeleteAnalyticsDashboardUseCase } from './application/use-cases/delete-analytics-dashboard.use-case';
import { ExportReportUseCase } from './application/use-cases/export-report.use-case';
import { GetAnalyticsDashboardUseCase } from './application/use-cases/get-analytics-dashboard.use-case';
import { GetCustomerInsightsUseCase } from './application/use-cases/get-customer-insights.use-case';
import { GetExecutiveDashboardUseCase } from './application/use-cases/get-executive-dashboard.use-case';
import { GetProductPerformanceUseCase } from './application/use-cases/get-product-performance.use-case';
import { GetSalesReportUseCase } from './application/use-cases/get-sales-report.use-case';
import { ListAnalyticsDashboardsUseCase } from './application/use-cases/list-analytics-dashboards.use-case';
import { ListAnalyticsEventsUseCase } from './application/use-cases/list-analytics-events.use-case';
import { RecordAnalyticsEventUseCase } from './application/use-cases/record-analytics-event.use-case';
import { UpdateAnalyticsDashboardUseCase } from './application/use-cases/update-analytics-dashboard.use-case';
import { PrismaAnalyticsDashboardRepository } from './infrastructure/persistence/prisma-analytics-dashboard.repository';
import { PrismaAnalyticsEventRepository } from './infrastructure/persistence/prisma-analytics-event.repository';
import { PrismaAnalyticsQueryRepository } from './infrastructure/persistence/prisma-analytics-query.repository';
import { AdminAnalyticsDashboardsController } from './presentation/controllers/admin-analytics-dashboards.controller';
import { AdminAnalyticsReportsController } from './presentation/controllers/admin-analytics-reports.controller';

@Module({
  imports: [IdentityModule],
  controllers: [AdminAnalyticsReportsController, AdminAnalyticsDashboardsController],
  providers: [
    AnalyticsCacheService,
    GetExecutiveDashboardUseCase,
    GetSalesReportUseCase,
    GetCustomerInsightsUseCase,
    GetProductPerformanceUseCase,
    RecordAnalyticsEventUseCase,
    ListAnalyticsEventsUseCase,
    ExportReportUseCase,
    ListAnalyticsDashboardsUseCase,
    GetAnalyticsDashboardUseCase,
    CreateAnalyticsDashboardUseCase,
    UpdateAnalyticsDashboardUseCase,
    DeleteAnalyticsDashboardUseCase,
    { provide: ANALYTICS_EVENT_REPOSITORY, useClass: PrismaAnalyticsEventRepository },
    { provide: ANALYTICS_DASHBOARD_REPOSITORY, useClass: PrismaAnalyticsDashboardRepository },
    { provide: ANALYTICS_QUERY_REPOSITORY, useClass: PrismaAnalyticsQueryRepository },
  ],
})
export class AnalyticsModule {}
