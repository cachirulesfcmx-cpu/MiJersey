import { Injectable } from '@nestjs/common';
import type { BlogCategory as PrismaBlogCategory } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { BlogCategoryEntity } from '../../domain/entities/blog-category.entity';
import type {
  BlogCategoryRepositoryPort,
  CreateBlogCategoryData,
  UpdateBlogCategoryData,
} from '../../domain/ports/blog-category.repository.port';

function toEntity(row: PrismaBlogCategory): BlogCategoryEntity {
  return new BlogCategoryEntity({
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaBlogCategoryRepository implements BlogCategoryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<BlogCategoryEntity | null> {
    const row = await this.prisma.blogCategory.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findBySlug(slug: string): Promise<BlogCategoryEntity | null> {
    const row = await this.prisma.blogCategory.findUnique({ where: { slug } });
    return row ? toEntity(row) : null;
  }

  async findByIds(ids: string[]): Promise<BlogCategoryEntity[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.blogCategory.findMany({ where: { id: { in: ids } } });
    return rows.map(toEntity);
  }

  async findAll(): Promise<BlogCategoryEntity[]> {
    const rows = await this.prisma.blogCategory.findMany({ orderBy: { name: 'asc' } });
    return rows.map(toEntity);
  }

  async create(data: CreateBlogCategoryData): Promise<BlogCategoryEntity> {
    const row = await this.prisma.blogCategory.create({ data });
    return toEntity(row);
  }

  async update(id: string, data: UpdateBlogCategoryData): Promise<BlogCategoryEntity> {
    const row = await this.prisma.blogCategory.update({ where: { id }, data });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.blogCategory.delete({ where: { id } });
  }
}
