import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { NotificationEntity } from '../entities/notification.entity';
import type {
  NotificationChannel,
  NotificationStatus,
} from '../value-objects/notification-channel-enums';

export interface CreateNotificationData {
  channel: NotificationChannel;
  templateKey: string;
  recipient: string;
  customerId: string | null;
  payload: Record<string, unknown>;
  idempotencyKey: string | null;
}

export interface UpdateNotificationStatusData {
  status: NotificationStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  lastError?: string | null;
  retryCount?: number;
}

export interface ListNotificationsParams extends PaginationParams {
  channel?: NotificationChannel;
  status?: NotificationStatus;
  customerId?: string;
  templateKey?: string;
  from?: Date;
  to?: Date;
}

export interface NotificationRepositoryPort {
  findById(id: string): Promise<NotificationEntity | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<NotificationEntity | null>;
  create(data: CreateNotificationData): Promise<NotificationEntity>;
  updateStatus(id: string, data: UpdateNotificationStatusData): Promise<NotificationEntity>;
  findMany(params: ListNotificationsParams): Promise<PaginatedResult<NotificationEntity>>;
}
