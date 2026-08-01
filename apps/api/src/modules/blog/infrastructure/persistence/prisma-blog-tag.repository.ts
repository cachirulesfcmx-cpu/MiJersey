import { Injectable } from '@nestjs/common';
import type { BlogTag as PrismaBlogTag } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { BlogTagEntity } from '../../domain/entities/blog-tag.entity';
import type {
  BlogTagRepositoryPort,
  CreateBlogTagData,
  UpdateBlogTagData,
} from '../../domain/ports/blog-tag.repository.port';

function toEntity(row: PrismaBlogTag): BlogTagEntity {
  return new BlogTagEntity({
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class PrismaBlogTagRepository implements BlogTagRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<BlogTagEntity | null> {
    const row = await this.prisma.blogTag.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findBySlug(slug: string): Promise<BlogTagEntity | null> {
    const row = await this.prisma.blogTag.findUnique({ where: { slug } });
    return row ? toEntity(row) : null;
  }

  async findByIds(ids: string[]): Promise<BlogTagEntity[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.blogTag.findMany({ where: { id: { in: ids } } });
    return rows.map(toEntity);
  }

  async findAll(): Promise<BlogTagEntity[]> {
    const rows = await this.prisma.blogTag.findMany({ orderBy: { name: 'asc' } });
    return rows.map(toEntity);
  }

  async create(data: CreateBlogTagData): Promise<BlogTagEntity> {
    const row = await this.prisma.blogTag.create({ data });
    return toEntity(row);
  }

  async update(id: string, data: UpdateBlogTagData): Promise<BlogTagEntity> {
    const row = await this.prisma.blogTag.update({ where: { id }, data });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.blogTag.delete({ where: { id } });
  }
}
