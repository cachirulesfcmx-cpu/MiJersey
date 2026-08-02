import type {
  NotificationChannel,
  NotificationStatus,
} from '../value-objects/notification-channel-enums';

export interface NotificationProps {
  id: string;
  channel: NotificationChannel;
  templateKey: string;
  recipient: string;
  customerId: string | null;
  status: NotificationStatus;
  payload: Record<string, unknown>;
  idempotencyKey: string | null;
  retryCount: number;
  lastError: string | null;
  queuedAt: Date;
  sentAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
}

export class NotificationEntity {
  constructor(private readonly props: NotificationProps) {}

  get id(): string {
    return this.props.id;
  }

  get status(): NotificationStatus {
    return this.props.status;
  }

  get retryCount(): number {
    return this.props.retryCount;
  }

  toJSON(): NotificationProps {
    return { ...this.props };
  }
}
