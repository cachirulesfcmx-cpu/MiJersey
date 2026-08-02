import type { PaginatedResult } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import type { NotificationEntity } from '../../domain/entities/notification.entity';
import type {
  ListNotificationsParams,
  NotificationRepositoryPort,
} from '../../domain/ports/notification.repository.port';
import { NOTIFICATION_REPOSITORY } from '../../notifications.constants';

/** `GET /admin/notifications` (extensión sobre el `GET /notifications` literal del spec, que aquí queda reservado al self-service del cliente) — bitácora completa para el Admin Dashboard/Delivery Status (034 §6), sin acotar por `customerId`. */
@Injectable()
export class ListNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepositoryPort,
  ) {}

  async execute(params: ListNotificationsParams): Promise<PaginatedResult<NotificationEntity>> {
    return this.notifications.findMany(params);
  }
}
