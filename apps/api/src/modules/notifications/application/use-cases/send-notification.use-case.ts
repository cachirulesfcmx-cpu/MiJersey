import { Inject, Injectable } from '@nestjs/common';

import type { NotificationEntity } from '../../domain/entities/notification.entity';
import type { NotificationRepositoryPort } from '../../domain/ports/notification.repository.port';
import type { NotificationPreferenceRepositoryPort } from '../../domain/ports/notification-preference.repository.port';
import type { NotificationChannel } from '../../domain/value-objects/notification-channel-enums';
import {
  NOTIFICATION_PREFERENCE_REPOSITORY,
  NOTIFICATION_REPOSITORY,
} from '../../notifications.constants';
import { NotificationDispatchService } from '../services/notification-dispatch.service';

export interface SendNotificationInput {
  channel: NotificationChannel;
  templateKey: string;
  recipient: string;
  customerId?: string | null;
  payload: Record<string, unknown>;
  idempotencyKey?: string | null;
}

/** Colector de notificaciones (034 §5), pensado para invocarse en proceso desde futuros productores (021 Orders, 022 Payments, 023 Shipping, 025 Customer Service) sin pasar por HTTP. Respeta idempotencia (§4: si `idempotencyKey` ya existe, devuelve el envío original sin duplicar) y preferencias del cliente (§4: si el cliente desactivó explícitamente el canal, no se crea ninguna fila — igual que `RecordTrackingEventUseCase` descarta un evento sin categoría de consentimiento otorgada). El propio ciclo de vida de `Notification` (QUEUED→SENT/DELIVERED o FAILED) funciona como el registro auditable de cada envío (§10) — no se duplica en `AuditLogRepositoryPort`, reservado para acciones administrativas explícitas (prueba, reintento, cambio de preferencias). */
@Injectable()
export class SendNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY) private readonly notifications: NotificationRepositoryPort,
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY)
    private readonly preferences: NotificationPreferenceRepositoryPort,
    private readonly dispatchService: NotificationDispatchService,
  ) {}

  async execute(input: SendNotificationInput): Promise<NotificationEntity | null> {
    if (input.idempotencyKey) {
      const existing = await this.notifications.findByIdempotencyKey(input.idempotencyKey);
      if (existing) return existing;
    }

    if (input.customerId) {
      const customerPreferences = await this.preferences.findByCustomer(input.customerId);
      const preference = customerPreferences.find((pref) => pref.channel === input.channel);
      if (preference && !preference.enabled) return null;
    }

    const notification = await this.notifications.create({
      channel: input.channel,
      templateKey: input.templateKey,
      recipient: input.recipient,
      customerId: input.customerId ?? null,
      payload: input.payload,
      idempotencyKey: input.idempotencyKey ?? null,
    });

    return this.dispatchService.dispatch(notification);
  }
}
