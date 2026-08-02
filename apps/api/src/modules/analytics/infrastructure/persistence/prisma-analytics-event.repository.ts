import type { PaginatedResult } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { AnalyticsEventEntity } from '../../domain/entities/analytics-event.entity';
import type {
  AnalyticsEventRepositoryPort,
  CreateAnalyticsEventData,
  ListAnalyticsEventsParams,
} from '../../domain/ports/analytics-event.repository.port';

function toEntity(row: {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  payload: Prisma.JsonValue;
  occurredAt: Date;
}): AnalyticsEventEntity {
  return new AnalyticsEventEntity({
    id: row.id,
    eventType: row.eventType,
    entityType: row.entityType,
    entityId: row.entityId,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    occurredAt: row.occurredAt,
  });
}

@Injectable()
export class PrismaAnalyticsEventRepository implements AnalyticsEventRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAnalyticsEventData): Promise<AnalyticsEventEntity> {
    const row = await this.prisma.analyticsEvent.create({
      data: {
        eventType: data.eventType,
        entityType: data.entityType,
        entityId: data.entityId,
        payload: data.payload as Prisma.InputJsonValue,
      },
    });
    return toEntity(row);
  }

  async findMany(
    params: ListAnalyticsEventsParams,
  ): Promise<PaginatedResult<AnalyticsEventEntity>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: Prisma.AnalyticsEventWhereInput = {
      ...(params.eventType ? { eventType: params.eventType } : {}),
      ...(params.entityType ? { entityType: params.entityType } : {}),
      ...(params.from || params.to
        ? {
            occurredAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.analyticsEvent.count({ where }),
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
