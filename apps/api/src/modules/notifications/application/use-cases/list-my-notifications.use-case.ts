import type { PaginatedResult } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import type { NotificationEntity } from '../../domain/entities/notification.entity';
import type { NotificationRepositoryPort } from '../../domain/ports/notification.repository.port';
import { NOTIFICATION_REPOSITORY } from '../../notifications.constants';

export interface ListMyNotificationsInput {
  customerId: string;
  page?: number;
  pageSize?: number;
}

/** `GET /notifications` (034 §7, self-service) — Notification Center/Notification Timeline (§6) del cliente autenticado: solo sus propias notificaciones. */
@Injectable()
export class ListMyNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepositoryPort,
  ) {}

  async execute(input: ListMyNotificationsInput): Promise<PaginatedResult<NotificationEntity>> {
    return this.notifications.findMany({
      customerId: input.customerId,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20,
    });
  }
}
