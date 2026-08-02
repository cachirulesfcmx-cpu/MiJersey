import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { NotificationEntity } from '../../domain/entities/notification.entity';
import {
  MaxRetriesExceededError,
  NotificationNotFailedError,
  NotificationNotFoundError,
} from '../../domain/errors/notifications.errors';
import type { NotificationRepositoryPort } from '../../domain/ports/notification.repository.port';
import { MAX_NOTIFICATION_RETRIES, NOTIFICATION_REPOSITORY } from '../../notifications.constants';
import { NotificationDispatchService } from '../services/notification-dispatch.service';

export interface RetryNotificationInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

/** Retry Manager (034 §6/§7 `POST /notifications/retry/:id`) — solo aplica a notificaciones `FAILED` y respeta un tope de reintentos (§4 "políticas configurables"); sin un worker/cron en este stack, el reintento es una acción explícita del administrador, no un job automático. */
@Injectable()
export class RetryNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly dispatchService: NotificationDispatchService,
  ) {}

  async execute(input: RetryNotificationInput): Promise<NotificationEntity> {
    const notification = await this.notifications.findById(input.id);
    if (!notification) throw new NotificationNotFoundError();

    const json = notification.toJSON();
    if (json.status !== 'FAILED') throw new NotificationNotFailedError();
    if (json.retryCount >= MAX_NOTIFICATION_RETRIES) throw new MaxRetriesExceededError();

    const bumped = await this.notifications.updateStatus(json.id, {
      status: 'QUEUED',
      retryCount: json.retryCount + 1,
    });
    const result = await this.dispatchService.dispatch(bumped);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'notification.retried',
      ipAddress: input.ipAddress,
      metadata: { notificationId: json.id, attempt: json.retryCount + 1 },
    });

    return result;
  }
}
