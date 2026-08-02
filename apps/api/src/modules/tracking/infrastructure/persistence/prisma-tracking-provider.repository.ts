import { Injectable } from '@nestjs/common';
import type { Prisma, TrackingProvider as PrismaTrackingProviderRow } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { TrackingProviderEntity } from '../../domain/entities/tracking-provider.entity';
import type {
  TrackingProviderRepositoryPort,
  UpsertTrackingProviderData,
} from '../../domain/ports/tracking-provider.repository.port';
import type { TrackingProviderType } from '../../domain/value-objects/tracking-provider-enums';

function toEntity(row: PrismaTrackingProviderRow): TrackingProviderEntity {
  return new TrackingProviderEntity({
    id: row.id,
    provider: row.provider as TrackingProviderType,
    status: row.status,
    configuration: (row.configuration ?? {}) as Record<string, unknown>,
    consentCategory: row.consentCategory,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaTrackingProviderRepository implements TrackingProviderRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<TrackingProviderEntity | null> {
    const row = await this.prisma.trackingProvider.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByProvider(provider: TrackingProviderType): Promise<TrackingProviderEntity | null> {
    const row = await this.prisma.trackingProvider.findUnique({ where: { provider } });
    return row ? toEntity(row) : null;
  }

  async findMany(): Promise<TrackingProviderEntity[]> {
    const rows = await this.prisma.trackingProvider.findMany({ orderBy: { provider: 'asc' } });
    return rows.map(toEntity);
  }

  async findActive(): Promise<TrackingProviderEntity[]> {
    const rows = await this.prisma.trackingProvider.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { provider: 'asc' },
    });
    return rows.map(toEntity);
  }

  async create(
    provider: TrackingProviderType,
    data: UpsertTrackingProviderData,
  ): Promise<TrackingProviderEntity> {
    const row = await this.prisma.trackingProvider.create({
      data: {
        provider,
        status: data.status,
        configuration: data.configuration as Prisma.InputJsonValue,
        consentCategory: data.consentCategory,
      },
    });
    return toEntity(row);
  }

  async update(
    id: string,
    data: Partial<UpsertTrackingProviderData>,
  ): Promise<TrackingProviderEntity> {
    const row = await this.prisma.trackingProvider.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.configuration !== undefined
          ? { configuration: data.configuration as Prisma.InputJsonValue }
          : {}),
        ...(data.consentCategory !== undefined ? { consentCategory: data.consentCategory } : {}),
      },
    });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.trackingProvider.delete({ where: { id } });
  }
}
