import type { NotificationChannel } from '../value-objects/notification-channel-enums';

export interface NotificationPreferenceProps {
  id: string;
  customerId: string;
  channel: NotificationChannel;
  enabled: boolean;
  updatedAt: Date;
}

export class NotificationPreferenceEntity {
  constructor(private readonly props: NotificationPreferenceProps) {}

  get channel(): NotificationChannel {
    return this.props.channel;
  }

  get enabled(): boolean {
    return this.props.enabled;
  }

  toJSON(): NotificationPreferenceProps {
    return { ...this.props };
  }
}
