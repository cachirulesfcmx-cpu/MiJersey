import { Inject, Injectable } from '@nestjs/common';

import type { NotificationEntity } from '../../domain/entities/notification.entity';
import type { NotificationRepositoryPort } from '../../domain/ports/notification.repository.port';
import type { NotificationChannelPort } from '../../domain/ports/notification-channel.port';
import type { NotificationChannel } from '../../domain/value-objects/notification-channel-enums';
import {
  NOTIFICATION_CHANNEL_REGISTRY,
  NOTIFICATION_REPOSITORY,
} from '../../notifications.constants';

/** Intenta el envío real a través del canal correspondiente y actualiza el estado (034 §3 "registrar todo el ciclo de vida") — compartido por `SendNotificationUseCase` (primer intento) y `RetryNotificationUseCase` (reintentos), para no duplicar la lógica de éxito/fallo. */
@Injectable()
export class NotificationDispatchService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepositoryPort,
    @Inject(NOTIFICATION_CHANNEL_REGISTRY)
    private readonly channels: Record<NotificationChannel, NotificationChannelPort>,
  ) {}

  async dispatch(notification: NotificationEntity): Promise<NotificationEntity> {
    const json = notification.toJSON();
    const channelPort = this.channels[json.channel];

    try {
      const result = await channelPort.send({
        recipient: json.recipient,
        templateKey: json.templateKey,
        payload: json.payload,
      });

      const now = new Date();
      return this.notifications.updateStatus(json.id, {
        status: result.delivered ? 'DELIVERED' : 'SENT',
        sentAt: now,
        ...(result.delivered ? { deliveredAt: now } : {}),
      });
    } catch (error) {
      return this.notifications.updateStatus(json.id, {
        status: 'FAILED',
        failedAt: new Date(),
        lastError: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
}
