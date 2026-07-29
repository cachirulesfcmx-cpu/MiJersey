import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  RecordSearchQueryData,
  SearchQueryLogRepositoryPort,
  TrendingTerm,
} from '../../domain/ports/search-query-log.repository.port';

@Injectable()
export class PrismaSearchQueryLogRepository implements SearchQueryLogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async record(data: RecordSearchQueryData): Promise<void> {
    await this.prisma.searchQueryLog.create({
      data: {
        term: data.term,
        normalizedTerm: data.normalizedTerm,
        resultsCount: data.resultsCount,
        sessionId: data.sessionId ?? null,
        customerId: data.customerId ?? null,
      },
    });
  }

  async findTrending(since: Date, limit: number): Promise<TrendingTerm[]> {
    const rows = await this.prisma.searchQueryLog.groupBy({
      by: ['normalizedTerm'],
      where: { createdAt: { gte: since }, normalizedTerm: { not: '' } },
      _count: { _all: true },
      orderBy: { _count: { normalizedTerm: 'desc' } },
      take: limit,
    });
    return rows.map((row) => ({ term: row.normalizedTerm, count: row._count._all }));
  }

  async findZeroResultTerms(since: Date, limit: number): Promise<TrendingTerm[]> {
    const rows = await this.prisma.searchQueryLog.groupBy({
      by: ['normalizedTerm'],
      where: { createdAt: { gte: since }, resultsCount: 0, normalizedTerm: { not: '' } },
      _count: { _all: true },
      orderBy: { _count: { normalizedTerm: 'desc' } },
      take: limit,
    });
    return rows.map((row) => ({ term: row.normalizedTerm, count: row._count._all }));
  }
}
