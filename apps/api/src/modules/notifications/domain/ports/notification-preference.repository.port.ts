import type { NotificationPreferenceEntity } from '../entities/notification-preference.entity';
import type { NotificationChannel } from '../value-objects/notification-channel-enums';

export interface NotificationPreferenceRepositoryPort {
  findByCustomer(customerId: string): Promise<NotificationPreferenceEntity[]>;
  upsert(
    customerId: string,
    channel: NotificationChannel,
    enabled: boolean,
  ): Promise<NotificationPreferenceEntity>;
}
