import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsIn, ValidateNested } from 'class-validator';

import {
  NOTIFICATION_CHANNELS,
  type NotificationChannel,
} from '../../domain/value-objects/notification-channel-enums';

class NotificationPreferenceUpdateDto {
  @IsIn(NOTIFICATION_CHANNELS)
  channel!: NotificationChannel;

  @IsBoolean()
  enabled!: boolean;
}

export class UpdateNotificationPreferencesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NotificationPreferenceUpdateDto)
  updates!: NotificationPreferenceUpdateDto[];
}
