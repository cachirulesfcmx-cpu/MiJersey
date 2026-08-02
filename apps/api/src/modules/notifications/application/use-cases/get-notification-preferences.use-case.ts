import { Inject, Injectable } from '@nestjs/common';

import type { NotificationPreferenceRepositoryPort } from '../../domain/ports/notification-preference.repository.port';
import { NOTIFICATION_CHANNELS } from '../../domain/value-objects/notification-channel-enums';
import { NOTIFICATION_PREFERENCE_REPOSITORY } from '../../notifications.constants';

export interface NotificationPreferenceView {
  channel: (typeof NOTIFICATION_CHANNELS)[number];
  enabled: boolean;
}

/** `GET /notifications/preferences` (034 §7, self-service) — un canal sin fila explícita se sintetiza como habilitado por defecto (solo se persiste cuando el cliente cambia algo), así que esta vista siempre devuelve los cuatro canales completos, nunca una lista parcial. */
@Injectable()
export class GetNotificationPreferencesUseCase {
  constructor(
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY)
    private readonly preferences: NotificationPreferenceRepositoryPort,
  ) {}

  async execute(customerId: string): Promise<NotificationPreferenceView[]> {
    const stored = await this.preferences.findByCustomer(customerId);
    const byChannel = new Map(stored.map((pref) => [pref.channel, pref.enabled]));

    return NOTIFICATION_CHANNELS.map((channel) => ({
      channel,
      enabled: byChannel.get(channel) ?? true,
    }));
  }
}
