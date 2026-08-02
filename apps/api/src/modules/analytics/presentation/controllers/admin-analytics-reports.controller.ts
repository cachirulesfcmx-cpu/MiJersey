import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Query,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { ExportReportUseCase } from '../../application/use-cases/export-report.use-case';
import { GetCustomerInsightsUseCase } from '../../application/use-cases/get-customer-insights.use-case';
import { GetExecutiveDashboardUseCase } from '../../application/use-cases/get-executive-dashboard.use-case';
import { GetProductPerformanceUseCase } from '../../application/use-cases/get-product-performance.use-case';
import { GetSalesReportUseCase } from '../../application/use-cases/get-sales-report.use-case';
import { ListAnalyticsEventsUseCase } from '../../application/use-cases/list-analytics-events.use-case';
import { RecordAnalyticsEventUseCase } from '../../application/use-cases/record-analytics-event.use-case';
import { DateRangeLimitQueryDto } from '../dto/date-range-limit-query.dto';
import { DateRangeQueryDto } from '../dto/date-range-query.dto';
import { ExportReportQueryDto } from '../dto/export-report-query.dto';
import { ListAnalyticsEventsQueryDto } from '../dto/list-analytics-events-query.dto';
import { RecordAnalyticsEventDto } from '../dto/record-analytics-event.dto';
import { AnalyticsExceptionFilter } from '../filters/analytics-exception.filter';

/** Reportes de solo lectura (spec 032 §6/§7) bajo `admin:access` — a diferencia de Site Configuration (`system:configure`) o del CRUD de contenido (`catalog:manage`), leer reportes no es una acción crítica del sistema ni edita contenido, así que cualquier rol con acceso al panel puede consultarlos. Exportar y registrar eventos exigen `catalog:manage` por dejar rastro/generar datos. */
@Controller('admin/analytics')
@UseGuards(PermissionsGuard)
@UseFilters(AnalyticsExceptionFilter)
export class AdminAnalyticsReportsController {
  constructor(
    private readonly getExecutiveDashboard: GetExecutiveDashboardUseCase,
    private readonly getSalesReport: GetSalesReportUseCase,
    private readonly getCustomerInsights: GetCustomerInsightsUseCase,
    private readonly getProductPerformance: GetProductPerformanceUseCase,
    private readonly listEvents: ListAnalyticsEventsUseCase,
    private readonly recordEvent: RecordAnalyticsEventUseCase,
    private readonly exportReport: ExportReportUseCase,
  ) {}

  @Get('dashboard')
  @RequirePermission('admin:access')
  async dashboard(@Query() query: DateRangeQueryDto) {
    return this.getExecutiveDashboard.execute({
      ...(query.from !== undefined ? { from: query.from } : {}),
      ...(query.to !== undefined ? { to: query.to } : {}),
    });
  }

  @Get('sales')
  @RequirePermission('admin:access')
  async sales(@Query() query: DateRangeQueryDto) {
    return this.getSalesReport.execute({
      ...(query.from !== undefined ? { from: query.from } : {}),
      ...(query.to !== undefined ? { to: query.to } : {}),
    });
  }

  @Get('customers')
  @RequirePermission('admin:access')
  async customers(@Query() query: DateRangeLimitQueryDto) {
    return this.getCustomerInsights.execute({
      ...(query.from !== undefined ? { from: query.from } : {}),
      ...(query.to !== undefined ? { to: query.to } : {}),
      ...(query.limit !== undefined ? { limit: query.limit } : {}),
    });
  }

  @Get('products')
  @RequirePermission('admin:access')
  async products(@Query() query: DateRangeLimitQueryDto) {
    return this.getProductPerformance.execute({
      ...(query.from !== undefined ? { from: query.from } : {}),
      ...(query.to !== undefined ? { to: query.to } : {}),
      ...(query.limit !== undefined ? { limit: query.limit } : {}),
    });
  }

  @Get('events')
  @RequirePermission('admin:access')
  async events(@Query() query: ListAnalyticsEventsQueryDto) {
    const result = await this.listEvents.execute({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.eventType !== undefined ? { eventType: query.eventType } : {}),
      ...(query.entityType !== undefined ? { entityType: query.entityType } : {}),
      ...(query.from !== undefined ? { from: new Date(query.from) } : {}),
      ...(query.to !== undefined ? { to: new Date(query.to) } : {}),
    });
    return { ...result, items: result.items.map((event) => event.toJSON()) };
  }

  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('catalog:manage')
  async createEvent(@Body() dto: RecordAnalyticsEventDto) {
    const event = await this.recordEvent.execute({
      eventType: dto.eventType,
      entityType: dto.entityType,
      entityId: dto.entityId,
      payload: dto.payload ?? {},
    });
    return event.toJSON();
  }

  @Get('export')
  @RequirePermission('catalog:manage')
  async export(
    @Query() query: ExportReportQueryDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.exportReport.execute({
      type: query.type,
      ...(query.from !== undefined ? { from: query.from } : {}),
      ...(query.to !== undefined ? { to: query.to } : {}),
      actorUserId: user.sub,
      ipAddress: ip,
    });

    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
    });
    return result.csv;
  }
}
