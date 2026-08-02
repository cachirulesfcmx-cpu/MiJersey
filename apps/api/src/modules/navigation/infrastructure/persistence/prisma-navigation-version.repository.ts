import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type { NavigationVersion as PrismaNavigationVersion } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import type { NavigationSnapshot } from '../../domain/entities/navigation-version.entity';
import { NavigationVersionEntity } from '../../domain/entities/navigation-version.entity';
import type {
  CreateNavigationVersionData,
  NavigationVersionRepositoryPort,
} from '../../domain/ports/navigation-version.repository.port';

function toEntity(row: PrismaNavigationVersion): NavigationVersionEntity {
  return new NavigationVersionEntity({
    id: row.id,
    menuId: row.menuId,
    versionNumber: row.versionNumber,
    snapshot: row.snapshot as unknown as NavigationSnapshot,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class PrismaNavigationVersionRepository implements NavigationVersionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByMenuAndNumber(
    menuId: string,
    versionNumber: number,
  ): Promise<NavigationVersionEntity | null> {
    const row = await this.prisma.navigationVersion.findUnique({
      where: { menuId_versionNumber: { menuId, versionNumber } },
    });
    return row ? toEntity(row) : null;
  }

  async findMany(
    menuId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<NavigationVersionEntity>> {
    const skip = (params.page - 1) * params.pageSize;
    const where = { menuId };

    const [rows, total] = await Promise.all([
      this.prisma.navigationVersion.findMany({
        where,
        orderBy: { versionNumber: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.navigationVersion.count({ where }),
    ]);

    return {
      items: rows.map(toEntity),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }

  async getNextVersionNumber(menuId: string): Promise<number> {
    const last = await this.prisma.navigationVersion.findFirst({
      where: { menuId },
      orderBy: { versionNumber: 'desc' },
    });
    return (last?.versionNumber ?? 0) + 1;
  }

  async create(data: CreateNavigationVersionData): Promise<NavigationVersionEntity> {
    const versionNumber = await this.getNextVersionNumber(data.menuId);
    const row = await this.prisma.navigationVersion.create({
      data: {
        menuId: data.menuId,
        versionNumber,
        snapshot: data.snapshot as object,
      },
    });
    return toEntity(row);
  }
}
