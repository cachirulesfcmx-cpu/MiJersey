import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import {
  AnalyticsDashboardEntity,
  type AnalyticsDashboardFilters,
  type AnalyticsWidget,
} from '../../domain/entities/analytics-dashboard.entity';
import type {
  AnalyticsDashboardRepositoryPort,
  UpsertAnalyticsDashboardData,
} from '../../domain/ports/analytics-dashboard.repository.port';

function toEntity(row: {
  id: string;
  name: string;
  widgets: Prisma.JsonValue;
  filters: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): AnalyticsDashboardEntity {
  return new AnalyticsDashboardEntity({
    id: row.id,
    name: row.name,
    widgets: (row.widgets ?? []) as unknown as AnalyticsWidget[],
    filters: (row.filters ?? null) as AnalyticsDashboardFilters | null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaAnalyticsDashboardRepository implements AnalyticsDashboardRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AnalyticsDashboardEntity | null> {
    const row = await this.prisma.analyticsDashboard.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findMany(): Promise<AnalyticsDashboardEntity[]> {
    const rows = await this.prisma.analyticsDashboard.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map(toEntity);
  }

  async create(data: UpsertAnalyticsDashboardData): Promise<AnalyticsDashboardEntity> {
    const row = await this.prisma.analyticsDashboard.create({
      data: {
        name: data.name,
        widgets: data.widgets as unknown as Prisma.InputJsonValue,
        filters: (data.filters ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
    return toEntity(row);
  }

  async update(
    id: string,
    data: Partial<UpsertAnalyticsDashboardData>,
  ): Promise<AnalyticsDashboardEntity> {
    const row = await this.prisma.analyticsDashboard.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.widgets !== undefined
          ? { widgets: data.widgets as unknown as Prisma.InputJsonValue }
          : {}),
        ...(data.filters !== undefined
          ? { filters: (data.filters ?? Prisma.JsonNull) as Prisma.InputJsonValue }
          : {}),
      },
    });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.analyticsDashboard.delete({ where: { id } });
  }
}
