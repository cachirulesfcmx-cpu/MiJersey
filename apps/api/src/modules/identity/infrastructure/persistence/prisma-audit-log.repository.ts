import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  AuditLogEntry,
  AuditLogRepositoryPort,
} from '../../domain/ports/audit-log.repository.port';

@Injectable()
export class PrismaAuditLogRepository implements AuditLogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        ipAddress: entry.ipAddress,
        ...(entry.metadata ? { metadata: entry.metadata as Prisma.InputJsonValue } : {}),
      },
    });
  }
}
