import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type { ThemeVersion as PrismaThemeVersion } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import type { ThemeSnapshot } from '../../domain/entities/theme-version.entity';
import { ThemeVersionEntity } from '../../domain/entities/theme-version.entity';
import type { ThemeVersionRepositoryPort } from '../../domain/ports/theme-version.repository.port';

function toEntity(row: PrismaThemeVersion): ThemeVersionEntity {
  return new ThemeVersionEntity({
    id: row.id,
    versionNumber: row.versionNumber,
    snapshot: row.snapshot as unknown as ThemeSnapshot,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class PrismaThemeVersionRepository implements ThemeVersionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByNumber(versionNumber: number): Promise<ThemeVersionEntity | null> {
    const row = await this.prisma.themeVersion.findUnique({ where: { versionNumber } });
    return row ? toEntity(row) : null;
  }

  async findMany(params: PaginationParams): Promise<PaginatedResult<ThemeVersionEntity>> {
    const skip = (params.page - 1) * params.pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.themeVersion.findMany({
        orderBy: { versionNumber: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.themeVersion.count(),
    ]);

    return {
      items: rows.map(toEntity),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }

  async getNextVersionNumber(): Promise<number> {
    const last = await this.prisma.themeVersion.findFirst({ orderBy: { versionNumber: 'desc' } });
    return (last?.versionNumber ?? 0) + 1;
  }

  async create(snapshot: ThemeSnapshot): Promise<ThemeVersionEntity> {
    const versionNumber = await this.getNextVersionNumber();
    const row = await this.prisma.themeVersion.create({
      data: { versionNumber, snapshot: snapshot as object },
    });
    return toEntity(row);
  }
}
