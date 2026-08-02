import type { PaginatedResult } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { TrackingEventEntity } from '../../domain/entities/tracking-event.entity';
import type {
  CreateTrackingEventData,
  ListTrackingEventsParams,
  TrackingEventRepositoryPort,
} from '../../domain/ports/tracking-event.repository.port';

function toEntity(row: {
  id: string;
  eventName: string;
  source: string;
  payload: Prisma.JsonValue;
  consentRequired: boolean;
  createdAt: Date;
}): TrackingEventEntity {
  return new TrackingEventEntity({
    id: row.id,
    eventName: row.eventName,
    source: row.source,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    consentRequired: row.consentRequired,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class PrismaTrackingEventRepository implements TrackingEventRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTrackingEventData): Promise<TrackingEventEntity> {
    const row = await this.prisma.trackingEvent.create({
      data: {
        eventName: data.eventName,
        source: data.source,
        payload: data.payload as Prisma.InputJsonValue,
        consentRequired: data.consentRequired,
      },
    });
    return toEntity(row);
  }

  async findMany(params: ListTrackingEventsParams): Promise<PaginatedResult<TrackingEventEntity>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: Prisma.TrackingEventWhereInput = {
      ...(params.eventName ? { eventName: params.eventName } : {}),
      ...(params.source ? { source: params.source } : {}),
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
      this.prisma.trackingEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.trackingEvent.count({ where }),
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
