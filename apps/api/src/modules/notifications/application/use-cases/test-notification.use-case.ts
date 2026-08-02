import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { NotificationEntity } from '../../domain/entities/notification.entity';
import type { NotificationRepositoryPort } from '../../domain/ports/notification.repository.port';
import type { NotificationChannel } from '../../domain/value-objects/notification-channel-enums';
import { NOTIFICATION_REPOSITORY } from '../../notifications.constants';
import { NotificationDispatchService } from '../services/notification-dispatch.service';

export interface TestNotificationInput {
  channel: NotificationChannel;
  templateKey: string;
  recipient: string;
  payload?: Record<string, unknown>;
  actorUserId: string;
  ipAddress: string | null;
}

/** `POST /admin/notifications/test` (034 §6 "Admin Dashboard"/Debug) — acción explícita del administrador: ignora idempotencia y preferencias del cliente (no hay un cliente real detrás de una prueba). */
@Injectable()
export class TestNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly dispatchService: NotificationDispatchService,
  ) {}

  async execute(input: TestNotificationInput): Promise<NotificationEntity> {
    const notification = await this.notifications.create({
      channel: input.channel,
      templateKey: input.templateKey,
      recipient: input.recipient,
      customerId: null,
      payload: input.payload ?? {},
      idempotencyKey: null,
    });

    const result = await this.dispatchService.dispatch(notification);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'notification.tested',
      ipAddress: input.ipAddress,
      metadata: {
        notificationId: notification.id,
        channel: input.channel,
        templateKey: input.templateKey,
      },
    });

    return result;
  }
}
