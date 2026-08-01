import type { PaginatedResult } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type { Page as PrismaPage, PageBlock as PrismaPageBlock, Prisma } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { PageEntity } from '../../domain/entities/page.entity';
import { PageBlockEntity } from '../../domain/entities/page-block.entity';
import type {
  CreatePageData,
  ListPagesParams,
  PageBlockInput,
  PageRepositoryPort,
  UpdatePageData,
} from '../../domain/ports/page.repository.port';
import { PageStatus } from '../../domain/value-objects/page-enums';

function toBlockCreateInput(blocks: PageBlockInput[]): Prisma.PageBlockCreateWithoutPageInput[] {
  return blocks.map((block) => ({
    type: block.type,
    position: block.position,
    config: block.config as Prisma.InputJsonValue,
  }));
}

type PageWithBlocks = PrismaPage & { blocks: PrismaPageBlock[] };

function toBlockEntity(row: PrismaPageBlock): PageBlockEntity {
  return new PageBlockEntity({
    id: row.id,
    pageId: row.pageId,
    type: row.type,
    position: row.position,
    config: row.config as Record<string, unknown>,
    createdAt: row.createdAt,
  });
}

function toEntity(row: PageWithBlocks): PageEntity {
  return new PageEntity({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status as PageStatus,
    template: row.template,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    publishedAt: row.publishedAt,
    blocks: row.blocks.map(toBlockEntity),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaPageRepository implements PageRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PageEntity | null> {
    const row = await this.prisma.page.findUnique({ where: { id }, include: { blocks: true } });
    return row ? toEntity(row) : null;
  }

  async findBySlug(slug: string): Promise<PageEntity | null> {
    const row = await this.prisma.page.findUnique({ where: { slug }, include: { blocks: true } });
    return row ? toEntity(row) : null;
  }

  async findMany(params: ListPagesParams): Promise<PaginatedResult<PageEntity>> {
    const skip = (params.page - 1) * params.pageSize;
    const where = params.status ? { status: params.status } : {};

    const [rows, total] = await Promise.all([
      this.prisma.page.findMany({
        where,
        include: { blocks: true },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.page.count({ where }),
    ]);

    return {
      items: rows.map(toEntity),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }

  async create(data: CreatePageData): Promise<PageEntity> {
    const row = await this.prisma.page.create({
      data: {
        title: data.title,
        slug: data.slug,
        template: data.template ?? 'default',
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        blocks: { create: toBlockCreateInput(data.blocks) },
      },
      include: { blocks: true },
    });
    return toEntity(row);
  }

  async update(id: string, data: UpdatePageData): Promise<PageEntity> {
    const { blocks, ...rest } = data;
    const row = await this.prisma.page.update({
      where: { id },
      data: {
        ...rest,
        ...(blocks !== undefined
          ? { blocks: { deleteMany: {}, create: toBlockCreateInput(blocks) } }
          : {}),
      },
      include: { blocks: true },
    });
    return toEntity(row);
  }

  async updateStatus(
    id: string,
    status: PageStatus,
    publishedAt: Date | null,
  ): Promise<PageEntity> {
    const row = await this.prisma.page.update({
      where: { id },
      data: { status, publishedAt },
      include: { blocks: true },
    });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.page.delete({ where: { id } });
  }
}
