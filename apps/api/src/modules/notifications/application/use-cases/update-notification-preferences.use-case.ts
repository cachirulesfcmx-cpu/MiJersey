import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { NotificationPreferenceRepositoryPort } from '../../domain/ports/notification-preference.repository.port';
import type { NotificationChannel } from '../../domain/value-objects/notification-channel-enums';
import { NOTIFICATION_PREFERENCE_REPOSITORY } from '../../notifications.constants';
import type { NotificationPreferenceView } from './get-notification-preferences.use-case';
import { GetNotificationPreferencesUseCase } from './get-notification-preferences.use-case';

export interface UpdateNotificationPreferencesInput {
  customerId: string;
  updates: Array<{ channel: NotificationChannel; enabled: boolean }>;
  ipAddress: string | null;
}

/** `PATCH /notifications/preferences` (034 §4 "respetar las preferencias del usuario", §7) — el propio cliente actualiza sus canales; se audita como cambio de preferencias (§10) usando su propio id como actor. */
@Injectable()
export class UpdateNotificationPreferencesUseCase {
  constructor(
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY)
    private readonly preferences: NotificationPreferenceRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly getPreferences: GetNotificationPreferencesUseCase,
  ) {}

  async execute(input: UpdateNotificationPreferencesInput): Promise<NotificationPreferenceView[]> {
    for (const update of input.updates) {
      await this.preferences.upsert(input.customerId, update.channel, update.enabled);
    }

    await this.auditLog.record({
      userId: input.customerId,
      action: 'notification.preferences_updated',
      ipAddress: input.ipAddress,
      metadata: { updatedChannels: input.updates.map((update) => update.channel) },
    });

    return this.getPreferences.execute(input.customerId);
  }
}
