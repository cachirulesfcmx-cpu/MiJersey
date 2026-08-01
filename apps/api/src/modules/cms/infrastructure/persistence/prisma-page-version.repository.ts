import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type { PageVersion as PrismaPageVersion } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import type { PageSnapshot } from '../../domain/entities/page-version.entity';
import { PageVersionEntity } from '../../domain/entities/page-version.entity';
import type {
  CreatePageVersionData,
  PageVersionRepositoryPort,
} from '../../domain/ports/page-version.repository.port';

function toEntity(row: PrismaPageVersion): PageVersionEntity {
  return new PageVersionEntity({
    id: row.id,
    pageId: row.pageId,
    versionNumber: row.versionNumber,
    snapshot: row.snapshot as unknown as PageSnapshot,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class PrismaPageVersionRepository implements PageVersionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByPageAndNumber(
    pageId: string,
    versionNumber: number,
  ): Promise<PageVersionEntity | null> {
    const row = await this.prisma.pageVersion.findUnique({
      where: { pageId_versionNumber: { pageId, versionNumber } },
    });
    return row ? toEntity(row) : null;
  }

  async findMany(
    pageId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<PageVersionEntity>> {
    const skip = (params.page - 1) * params.pageSize;
    const where = { pageId };

    const [rows, total] = await Promise.all([
      this.prisma.pageVersion.findMany({
        where,
        orderBy: { versionNumber: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.pageVersion.count({ where }),
    ]);

    return {
      items: rows.map(toEntity),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }

  async getNextVersionNumber(pageId: string): Promise<number> {
    const last = await this.prisma.pageVersion.findFirst({
      where: { pageId },
      orderBy: { versionNumber: 'desc' },
    });
    return (last?.versionNumber ?? 0) + 1;
  }

  async create(data: CreatePageVersionData): Promise<PageVersionEntity> {
    const versionNumber = await this.getNextVersionNumber(data.pageId);
    const row = await this.prisma.pageVersion.create({
      data: {
        pageId: data.pageId,
        versionNumber,
        snapshot: data.snapshot as object,
      },
    });
    return toEntity(row);
  }
}
