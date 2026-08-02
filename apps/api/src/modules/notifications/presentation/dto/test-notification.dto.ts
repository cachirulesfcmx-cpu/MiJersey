import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

import {
  NOTIFICATION_CHANNELS,
  type NotificationChannel,
} from '../../domain/value-objects/notification-channel-enums';

export class TestNotificationDto {
  @IsIn(NOTIFICATION_CHANNELS)
  channel!: NotificationChannel;

  @IsString()
  templateKey!: string;

  @IsString()
  recipient!: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
