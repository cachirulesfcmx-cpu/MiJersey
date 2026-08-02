import { Body, Controller, Get, Ip, Post, Query, UseFilters, UseGuards } from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { ListTrackingEventsUseCase } from '../../application/use-cases/list-tracking-events.use-case';
import { TestTrackingEventUseCase } from '../../application/use-cases/test-tracking-event.use-case';
import { ListTrackingEventsQueryDto } from '../dto/list-tracking-events-query.dto';
import { TestTrackingEventDto } from '../dto/test-tracking-event.dto';
import { TrackingExceptionFilter } from '../filters/tracking-exception.filter';

/** Bitácora de eventos y "Debug Console" (033 §6/§7). Lecturas bajo `admin:access`; enviar un evento de prueba mueve datos hacia un proveedor externo (real, cuando haya credenciales) así que exige `system:configure`, igual que la gestión de proveedores. */
@Controller('admin/tracking/events')
@UseGuards(PermissionsGuard)
@UseFilters(TrackingExceptionFilter)
export class AdminTrackingEventsController {
  constructor(
    private readonly listEvents: ListTrackingEventsUseCase,
    private readonly testEvent: TestTrackingEventUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Query() query: ListTrackingEventsQueryDto) {
    const result = await this.listEvents.execute({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.eventName !== undefined ? { eventName: query.eventName } : {}),
      ...(query.source !== undefined ? { source: query.source } : {}),
      ...(query.from !== undefined ? { from: new Date(query.from) } : {}),
      ...(query.to !== undefined ? { to: new Date(query.to) } : {}),
    });
    return { ...result, items: result.items.map((event) => event.toJSON()) };
  }

  @Post('test')
  @RequirePermission('system:configure')
  async test(
    @Body() dto: TestTrackingEventDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    return this.testEvent.execute({
      providerId: dto.providerId,
      eventName: dto.eventName,
      payload: dto.payload ?? {},
      actorUserId: user.sub,
      ipAddress: ip,
    });
  }
}
