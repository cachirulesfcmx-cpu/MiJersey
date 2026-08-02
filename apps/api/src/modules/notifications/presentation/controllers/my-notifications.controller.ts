import { Body, Controller, Get, Ip, Patch, Query, UseFilters } from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { GetNotificationPreferencesUseCase } from '../../application/use-cases/get-notification-preferences.use-case';
import { ListMyNotificationsUseCase } from '../../application/use-cases/list-my-notifications.use-case';
import { UpdateNotificationPreferencesUseCase } from '../../application/use-cases/update-notification-preferences.use-case';
import { ListMyNotificationsQueryDto } from '../dto/list-my-notifications-query.dto';
import { UpdateNotificationPreferencesDto } from '../dto/update-notification-preferences.dto';
import { NotificationsExceptionFilter } from '../filters/notifications-exception.filter';

/** Self-service (034 §7, rutas literales del spec) — todas las rutas de `/notifications` requieren sesión (guard global, sin `@Public()`), sin noción de permiso: solo "son tus propias notificaciones/preferencias", mismo criterio que `/me/*` en Customer Account (019). La gestión administrativa (ver todas, probar, reintentar) vive en `/admin/notifications/*`. */
@Controller('notifications')
@UseFilters(NotificationsExceptionFilter)
export class MyNotificationsController {
  constructor(
    private readonly listMyNotifications: ListMyNotificationsUseCase,
    private readonly getPreferences: GetNotificationPreferencesUseCase,
    private readonly updatePreferences: UpdateNotificationPreferencesUseCase,
  ) {}

  @Get()
  async list(@Query() query: ListMyNotificationsQueryDto, @CurrentUser() user: AccessTokenPayload) {
    const result = await this.listMyNotifications.execute({
      customerId: user.sub,
      page: query.page,
      pageSize: query.pageSize,
    });
    return { ...result, items: result.items.map((notification) => notification.toJSON()) };
  }

  @Get('preferences')
  async getMyPreferences(@CurrentUser() user: AccessTokenPayload) {
    return this.getPreferences.execute(user.sub);
  }

  @Patch('preferences')
  async updateMyPreferences(
    @Body() dto: UpdateNotificationPreferencesDto,
    @CurrentUser() user: AccessTokenPayload,
    @Ip() ip: string,
  ) {
    return this.updatePreferences.execute({
      customerId: user.sub,
      updates: dto.updates,
      ipAddress: ip,
    });
  }
}
