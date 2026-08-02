import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { CreateAnalyticsDashboardUseCase } from '../../application/use-cases/create-analytics-dashboard.use-case';
import { DeleteAnalyticsDashboardUseCase } from '../../application/use-cases/delete-analytics-dashboard.use-case';
import { GetAnalyticsDashboardUseCase } from '../../application/use-cases/get-analytics-dashboard.use-case';
import { ListAnalyticsDashboardsUseCase } from '../../application/use-cases/list-analytics-dashboards.use-case';
import { UpdateAnalyticsDashboardUseCase } from '../../application/use-cases/update-analytics-dashboard.use-case';
import { CreateAnalyticsDashboardDto } from '../dto/create-analytics-dashboard.dto';
import { UpdateAnalyticsDashboardDto } from '../dto/update-analytics-dashboard.dto';
import { AnalyticsExceptionFilter } from '../filters/analytics-exception.filter';

/** CRUD de dashboards configurables (spec 032 §12 "los dashboards sean configurables") — endpoint más allá del `GET /analytics/dashboard` literal del spec §7, mismo criterio de extensión que Theme/Navigation con sus endpoints `/versions`. */
@Controller('admin/analytics/dashboards')
@UseGuards(PermissionsGuard)
@UseFilters(AnalyticsExceptionFilter)
export class AdminAnalyticsDashboardsController {
  constructor(
    private readonly listDashboards: ListAnalyticsDashboardsUseCase,
    private readonly getDashboard: GetAnalyticsDashboardUseCase,
    private readonly createDashboard: CreateAnalyticsDashboardUseCase,
    private readonly updateDashboard: UpdateAnalyticsDashboardUseCase,
    private readonly deleteDashboard: DeleteAnalyticsDashboardUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list() {
    const dashboards = await this.listDashboards.execute();
    return dashboards.map((dashboard) => dashboard.toJSON());
  }

  @Get(':id')
  @RequirePermission('admin:access')
  async get(@Param('id') id: string) {
    const dashboard = await this.getDashboard.execute(id);
    return dashboard.toJSON();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async create(
    @Body() dto: CreateAnalyticsDashboardDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const dashboard = await this.createDashboard.execute({
      name: dto.name,
      widgets: dto.widgets,
      filters: dto.filters ?? null,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return dashboard.toJSON();
  }

  @Patch(':id')
  @RequirePermission('catalog:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAnalyticsDashboardDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const dashboard = await this.updateDashboard.execute({
      id,
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.widgets !== undefined ? { widgets: dto.widgets } : {}),
      ...(dto.filters !== undefined ? { filters: dto.filters } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return dashboard.toJSON();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('catalog:manage')
  async delete(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    await this.deleteDashboard.execute({ id, actorUserId: user.sub, ipAddress: ip });
  }
}
