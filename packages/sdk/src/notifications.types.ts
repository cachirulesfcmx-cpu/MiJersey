export type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';

export type NotificationStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';

export interface Notification {
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
  queuedAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  createdAt: string;
}

export interface NotificationPreference {
  channel: NotificationChannel;
  enabled: boolean;
}

export interface ListMyNotificationsParams {
  page?: number;
  pageSize?: number;
}

export interface ListNotificationsParams extends ListMyNotificationsParams {
  channel?: NotificationChannel;
  status?: NotificationStatus;
  customerId?: string;
  templateKey?: string;
  from?: string;
  to?: string;
}

export interface UpdateNotificationPreferencesInput {
  updates: Array<{ channel: NotificationChannel; enabled: boolean }>;
}

export interface TestNotificationInput {
  channel: NotificationChannel;
  templateKey: string;
  recipient: string;
  payload?: Record<string, unknown>;
}
