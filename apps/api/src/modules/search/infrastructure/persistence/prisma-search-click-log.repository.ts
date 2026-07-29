import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  RecordSearchClickData,
  SearchClickLogRepositoryPort,
} from '../../domain/ports/search-click-log.repository.port';

@Injectable()
export class PrismaSearchClickLogRepository implements SearchClickLogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async record(data: RecordSearchClickData): Promise<void> {
    await this.prisma.searchClickLog.create({
      data: {
        term: data.term,
        entityType: data.entityType,
        entityId: data.entityId,
        sessionId: data.sessionId ?? null,
      },
    });
  }
}
