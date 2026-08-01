import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type { PostVersion as PrismaPostVersion } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import type { PostSnapshot } from '../../domain/entities/post-version.entity';
import { PostVersionEntity } from '../../domain/entities/post-version.entity';
import type {
  CreatePostVersionData,
  PostVersionRepositoryPort,
} from '../../domain/ports/post-version.repository.port';

function toEntity(row: PrismaPostVersion): PostVersionEntity {
  return new PostVersionEntity({
    id: row.id,
    postId: row.postId,
    versionNumber: row.versionNumber,
    snapshot: row.snapshot as unknown as PostSnapshot,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class PrismaPostVersionRepository implements PostVersionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByPostAndNumber(
    postId: string,
    versionNumber: number,
  ): Promise<PostVersionEntity | null> {
    const row = await this.prisma.postVersion.findUnique({
      where: { postId_versionNumber: { postId, versionNumber } },
    });
    return row ? toEntity(row) : null;
  }

  async findMany(
    postId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<PostVersionEntity>> {
    const skip = (params.page - 1) * params.pageSize;
    const where = { postId };

    const [rows, total] = await Promise.all([
      this.prisma.postVersion.findMany({
        where,
        orderBy: { versionNumber: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.postVersion.count({ where }),
    ]);

    return {
      items: rows.map(toEntity),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }

  async getNextVersionNumber(postId: string): Promise<number> {
    const last = await this.prisma.postVersion.findFirst({
      where: { postId },
      orderBy: { versionNumber: 'desc' },
    });
    return (last?.versionNumber ?? 0) + 1;
  }

  async create(data: CreatePostVersionData): Promise<PostVersionEntity> {
    const versionNumber = await this.getNextVersionNumber(data.postId);
    const row = await this.prisma.postVersion.create({
      data: {
        postId: data.postId,
        versionNumber,
        snapshot: data.snapshot as object,
      },
    });
    return toEntity(row);
  }
}
