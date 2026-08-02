import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import { NotificationPreferenceEntity } from '../../domain/entities/notification-preference.entity';
import type { NotificationPreferenceRepositoryPort } from '../../domain/ports/notification-preference.repository.port';
import type { NotificationChannel } from '../../domain/value-objects/notification-channel-enums';

function toEntity(row: {
  id: string;
  customerId: string;
  channel: string;
  enabled: boolean;
  updatedAt: Date;
}): NotificationPreferenceEntity {
  return new NotificationPreferenceEntity({
    id: row.id,
    customerId: row.customerId,
    channel: row.channel as NotificationChannel,
    enabled: row.enabled,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaNotificationPreferenceRepository implements NotificationPreferenceRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByCustomer(customerId: string): Promise<NotificationPreferenceEntity[]> {
    const rows = await this.prisma.notificationPreference.findMany({ where: { customerId } });
    return rows.map(toEntity);
  }

  async upsert(
    customerId: string,
    channel: NotificationChannel,
    enabled: boolean,
  ): Promise<NotificationPreferenceEntity> {
    const row = await this.prisma.notificationPreference.upsert({
      where: { customerId_channel: { customerId, channel } },
      update: { enabled },
      create: { customerId, channel, enabled },
    });
    return toEntity(row);
  }
}
