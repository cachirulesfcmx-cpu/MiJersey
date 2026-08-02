import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { RequirePermission } from '../../../identity/presentation/decorators/require-permission.decorator';
import { PermissionsGuard } from '../../../identity/presentation/guards/permissions.guard';
import { ListNotificationsUseCase } from '../../application/use-cases/list-notifications.use-case';
import { RetryNotificationUseCase } from '../../application/use-cases/retry-notification.use-case';
import { TestNotificationUseCase } from '../../application/use-cases/test-notification.use-case';
import { ListNotificationsQueryDto } from '../dto/list-notifications-query.dto';
import { TestNotificationDto } from '../dto/test-notification.dto';
import { NotificationsExceptionFilter } from '../filters/notifications-exception.filter';

/** Admin Dashboard/Delivery Status/Retry Manager (034 §6) — extensión bajo `/admin/notifications/*` sobre el `GET /notifications` literal del spec, que aquí queda reservado al self-service del cliente (ver `MyNotificationsController`). Lecturas bajo `admin:access`; probar/reintentar mueven mensajes reales hacia un canal externo, así que exigen `catalog:manage`, mismo criterio que Test Send de Email Templates (031). */
@Controller('admin/notifications')
@UseGuards(PermissionsGuard)
@UseFilters(NotificationsExceptionFilter)
export class AdminNotificationsController {
  constructor(
    private readonly listNotifications: ListNotificationsUseCase,
    private readonly testNotification: TestNotificationUseCase,
    private readonly retryNotification: RetryNotificationUseCase,
  ) {}

  @Get()
  @RequirePermission('admin:access')
  async list(@Query() query: ListNotificationsQueryDto) {
    const result = await this.listNotifications.execute({
      page: query.page,
      pageSize: query.pageSize,
      ...(query.channel !== undefined ? { channel: query.channel } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.customerId !== undefined ? { customerId: query.customerId } : {}),
      ...(query.templateKey !== undefined ? { templateKey: query.templateKey } : {}),
      ...(query.from !== undefined ? { from: new Date(query.from) } : {}),
      ...(query.to !== undefined ? { to: new Date(query.to) } : {}),
    });
    return { ...result, items: result.items.map((notification) => notification.toJSON()) };
  }

  @Post('test')
  @RequirePermission('catalog:manage')
  async test(
    @Body() dto: TestNotificationDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    const notification = await this.testNotification.execute({
      channel: dto.channel,
      templateKey: dto.templateKey,
      recipient: dto.recipient,
      payload: dto.payload ?? {},
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return notification.toJSON();
  }

  @Post(':id/retry')
  @RequirePermission('catalog:manage')
  async retry(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, @Ip() ip: string) {
    const notification = await this.retryNotification.execute({
      id,
      actorUserId: user.sub,
      ipAddress: ip,
    });
    return notification.toJSON();
  }
}
