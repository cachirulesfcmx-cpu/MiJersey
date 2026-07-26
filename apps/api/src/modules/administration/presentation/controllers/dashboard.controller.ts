import { Controller, Get, UseGuards } from '@nestjs/common';

import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { GetDashboardMetricsUseCase } from '../../application/use-cases/get-dashboard-metrics.use-case';
import { GetRecentActivityUseCase } from '../../application/use-cases/get-recent-activity.use-case';

@Controller('admin/dashboard')
@UseGuards(PermissionsGuard)
export class DashboardController {
  constructor(
    private readonly getDashboardMetricsUseCase: GetDashboardMetricsUseCase,
    private readonly getRecentActivityUseCase: GetRecentActivityUseCase,
  ) {}

  @Get('metrics')
  @RequirePermission('admin:access')
  getMetrics() {
    return this.getDashboardMetricsUseCase.execute();
  }

  @Get('activity')
  @RequirePermission('admin:access')
  getActivity() {
    return this.getRecentActivityUseCase.execute();
  }
}
