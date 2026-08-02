import { Module } from '@nestjs/common';

import { EmailTemplatesModule } from '../email-templates/email-templates.module';
import { IdentityModule } from '../identity/identity.module';
import { NotificationDispatchService } from './application/services/notification-dispatch.service';
import { GetNotificationPreferencesUseCase } from './application/use-cases/get-notification-preferences.use-case';
import { ListMyNotificationsUseCase } from './application/use-cases/list-my-notifications.use-case';
import { ListNotificationsUseCase } from './application/use-cases/list-notifications.use-case';
import { RetryNotificationUseCase } from './application/use-cases/retry-notification.use-case';
import { SendNotificationUseCase } from './application/use-cases/send-notification.use-case';
import { TestNotificationUseCase } from './application/use-cases/test-notification.use-case';
import { UpdateNotificationPreferencesUseCase } from './application/use-cases/update-notification-preferences.use-case';
import type { NotificationChannelPort } from './domain/ports/notification-channel.port';
import type { NotificationChannel } from './domain/value-objects/notification-channel-enums';
import { ConsoleNotificationChannel } from './infrastructure/channels/console-notification-channel';
import { EmailNotificationChannel } from './infrastructure/channels/email-notification-channel';
import { PrismaNotificationRepository } from './infrastructure/persistence/prisma-notification.repository';
import { PrismaNotificationPreferenceRepository } from './infrastructure/persistence/prisma-notification-preference.repository';
import {
  NOTIFICATION_CHANNEL_REGISTRY,
  NOTIFICATION_PREFERENCE_REPOSITORY,
  NOTIFICATION_REPOSITORY,
} from './notifications.constants';
import { AdminNotificationsController } from './presentation/controllers/admin-notifications.controller';
import { MyNotificationsController } from './presentation/controllers/my-notifications.controller';

@Module({
  imports: [IdentityModule, EmailTemplatesModule],
  controllers: [MyNotificationsController, AdminNotificationsController],
  providers: [
    NotificationDispatchService,
    SendNotificationUseCase,
    RetryNotificationUseCase,
    TestNotificationUseCase,
    ListNotificationsUseCase,
    ListMyNotificationsUseCase,
    GetNotificationPreferencesUseCase,
    UpdateNotificationPreferencesUseCase,
    EmailNotificationChannel,
    { provide: NOTIFICATION_REPOSITORY, useClass: PrismaNotificationRepository },
    {
      provide: NOTIFICATION_PREFERENCE_REPOSITORY,
      useClass: PrismaNotificationPreferenceRepository,
    },
    {
      provide: NOTIFICATION_CHANNEL_REGISTRY,
      useFactory: (
        emailChannel: EmailNotificationChannel,
      ): Record<NotificationChannel, NotificationChannelPort> => ({
        EMAIL: emailChannel,
        SMS: new ConsoleNotificationChannel('SMS'),
        WHATSAPP: new ConsoleNotificationChannel('WHATSAPP'),
        PUSH: new ConsoleNotificationChannel('PUSH'),
      }),
      inject: [EmailNotificationChannel],
    },
  ],
  exports: [SendNotificationUseCase],
})
export class NotificationsModule {}
