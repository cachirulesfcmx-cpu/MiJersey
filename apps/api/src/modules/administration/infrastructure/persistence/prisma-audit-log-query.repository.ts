import { Injectable } from '@nestjs/common';
import type { AuditLog, Prisma } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  AuditLogQueryParams,
  AuditLogQueryPort,
  AuditLogQueryResult,
  AuditLogRecord,
} from '../../domain/ports/audit-log-query.port';

@Injectable()
export class PrismaAuditLogQueryRepository implements AuditLogQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async query(params: AuditLogQueryParams): Promise<AuditLogQueryResult> {
    const { filter, page, pageSize } = params;

    const where: Prisma.AuditLogWhereInput = {
      ...(filter?.action ? { action: { contains: filter.action, mode: 'insensitive' } } : {}),
      ...(filter?.userId ? { userId: filter.userId } : {}),
      ...(filter?.fromDate || filter?.toDate
        ? {
            createdAt: {
              ...(filter.fromDate ? { gte: filter.fromDate } : {}),
              ...(filter.toDate ? { lte: filter.toDate } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items: items.map((item) => this.toRecord(item)), total };
  }

  async listRecent(limit: number): Promise<AuditLogRecord[]> {
    const items = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return items.map((item) => this.toRecord(item));
  }

  private toRecord(item: AuditLog): AuditLogRecord {
    return {
      id: item.id,
      userId: item.userId,
      action: item.action,
      ipAddress: item.ipAddress,
      metadata: (item.metadata as Record<string, unknown> | null) ?? null,
      createdAt: item.createdAt,
    };
  }
}
