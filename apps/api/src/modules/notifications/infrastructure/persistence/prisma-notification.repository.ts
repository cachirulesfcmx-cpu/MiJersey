import type { PaginatedResult } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { NotificationEntity } from '../../domain/entities/notification.entity';
import type {
  CreateNotificationData,
  ListNotificationsParams,
  NotificationRepositoryPort,
  UpdateNotificationStatusData,
} from '../../domain/ports/notification.repository.port';
import type {
  NotificationChannel,
  NotificationStatus,
} from '../../domain/value-objects/notification-channel-enums';

function toEntity(row: {
  id: string;
  channel: string;
  templateKey: string;
  recipient: string;
  customerId: string | null;
  status: string;
  payload: Prisma.JsonValue;
  idempotencyKey: string | null;
  retryCount: number;
  lastError: string | null;
  queuedAt: Date;
  sentAt: Date | null;
  deliveredAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
}): NotificationEntity {
  return new NotificationEntity({
    id: row.id,
    channel: row.channel as NotificationChannel,
    templateKey: row.templateKey,
    recipient: row.recipient,
    customerId: row.customerId,
    status: row.status as NotificationStatus,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    idempotencyKey: row.idempotencyKey,
    retryCount: row.retryCount,
    lastError: row.lastError,
    queuedAt: row.queuedAt,
    sentAt: row.sentAt,
    deliveredAt: row.deliveredAt,
    failedAt: row.failedAt,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class PrismaNotificationRepository implements NotificationRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<NotificationEntity | null> {
    const row = await this.prisma.notification.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<NotificationEntity | null> {
    const row = await this.prisma.notification.findUnique({ where: { idempotencyKey } });
    return row ? toEntity(row) : null;
  }

  async create(data: CreateNotificationData): Promise<NotificationEntity> {
    const row = await this.prisma.notification.create({
      data: {
        channel: data.channel,
        templateKey: data.templateKey,
        recipient: data.recipient,
        customerId: data.customerId,
        payload: data.payload as Prisma.InputJsonValue,
        idempotencyKey: data.idempotencyKey,
      },
    });
    return toEntity(row);
  }

  async updateStatus(id: string, data: UpdateNotificationStatusData): Promise<NotificationEntity> {
    const row = await this.prisma.notification.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.sentAt !== undefined ? { sentAt: data.sentAt } : {}),
        ...(data.deliveredAt !== undefined ? { deliveredAt: data.deliveredAt } : {}),
        ...(data.failedAt !== undefined ? { failedAt: data.failedAt } : {}),
        ...(data.lastError !== undefined ? { lastError: data.lastError } : {}),
        ...(data.retryCount !== undefined ? { retryCount: data.retryCount } : {}),
      },
    });
    return toEntity(row);
  }

  async findMany(params: ListNotificationsParams): Promise<PaginatedResult<NotificationEntity>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: Prisma.NotificationWhereInput = {
      ...(params.channel ? { channel: params.channel } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.customerId ? { customerId: params.customerId } : {}),
      ...(params.templateKey ? { templateKey: params.templateKey } : {}),
      ...(params.from || params.to
        ? {
            createdAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: rows.map(toEntity),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
}
