import type { PaginatedResult } from '@mijersey/shared-types';
import { Injectable } from '@nestjs/common';
import type {
  BlogCategory as PrismaBlogCategory,
  BlogTag as PrismaBlogTag,
  Post as PrismaPost,
  PostCategory as PrismaPostCategory,
  PostTag as PrismaPostTag,
  Prisma,
  User as PrismaUser,
} from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';
import { PostEntity } from '../../domain/entities/post.entity';
import type {
  CreatePostData,
  ListPostsParams,
  ListPublishedPostsParams,
  PostRepositoryPort,
  UpdatePostData,
} from '../../domain/ports/post.repository.port';
import { PostStatus } from '../../domain/value-objects/post-enums';

const POST_INCLUDE = {
  author: { select: { id: true, firstName: true, lastName: true } },
  categories: { include: { category: true } },
  tags: { include: { tag: true } },
} satisfies Prisma.PostInclude;

type PostRow = PrismaPost & {
  author: Pick<PrismaUser, 'id' | 'firstName' | 'lastName'>;
  categories: (PrismaPostCategory & { category: PrismaBlogCategory })[];
  tags: (PrismaPostTag & { tag: PrismaBlogTag })[];
};

function toEntity(row: PostRow): PostEntity {
  return new PostEntity({
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    featuredImage: row.featuredImage,
    status: row.status as PostStatus,
    publishedAt: row.publishedAt,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    author: row.author,
    categories: row.categories.map((entry) => ({
      id: entry.category.id,
      name: entry.category.name,
      slug: entry.category.slug,
    })),
    tags: row.tags.map((entry) => ({
      id: entry.tag.id,
      name: entry.tag.name,
      slug: entry.tag.slug,
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaPostRepository implements PostRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PostEntity | null> {
    const row = await this.prisma.post.findUnique({ where: { id }, include: POST_INCLUDE });
    return row ? toEntity(row) : null;
  }

  async findBySlug(slug: string): Promise<PostEntity | null> {
    const row = await this.prisma.post.findUnique({ where: { slug }, include: POST_INCLUDE });
    return row ? toEntity(row) : null;
  }

  async findMany(params: ListPostsParams): Promise<PaginatedResult<PostEntity>> {
    const skip = (params.page - 1) * params.pageSize;
    const where = params.status ? { status: params.status } : {};

    const [rows, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: POST_INCLUDE,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items: rows.map(toEntity),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }

  async findManyPublished(params: ListPublishedPostsParams): Promise<PaginatedResult<PostEntity>> {
    const skip = (params.page - 1) * params.pageSize;
    const where: Prisma.PostWhereInput = {
      status: 'PUBLISHED',
      ...(params.categorySlug
        ? { categories: { some: { category: { slug: params.categorySlug } } } }
        : {}),
      ...(params.tagSlug ? { tags: { some: { tag: { slug: params.tagSlug } } } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: POST_INCLUDE,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: params.pageSize,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      items: rows.map(toEntity),
      page: params.page,
      pageSize: params.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    };
  }

  async findPublishedCandidatesForRelated(
    postId: string,
    categoryIds: string[],
    tagIds: string[],
  ): Promise<PostEntity[]> {
    const rows = await this.prisma.post.findMany({
      where: {
        id: { not: postId },
        status: 'PUBLISHED',
        OR: [
          ...(categoryIds.length > 0
            ? [{ categories: { some: { categoryId: { in: categoryIds } } } }]
            : []),
          ...(tagIds.length > 0 ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
        ],
      },
      include: POST_INCLUDE,
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });
    return rows.map(toEntity);
  }

  async create(data: CreatePostData): Promise<PostEntity> {
    const row = await this.prisma.post.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt ?? null,
        content: data.content,
        featuredImage: data.featuredImage ?? null,
        authorId: data.authorId,
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        categories: { create: data.categoryIds.map((categoryId) => ({ categoryId })) },
        tags: { create: data.tagIds.map((tagId) => ({ tagId })) },
      },
      include: POST_INCLUDE,
    });
    return toEntity(row);
  }

  async update(id: string, data: UpdatePostData): Promise<PostEntity> {
    const { categoryIds, tagIds, ...rest } = data;
    const row = await this.prisma.post.update({
      where: { id },
      data: {
        ...rest,
        ...(categoryIds !== undefined
          ? {
              categories: {
                deleteMany: {},
                create: categoryIds.map((categoryId) => ({ categoryId })),
              },
            }
          : {}),
        ...(tagIds !== undefined
          ? { tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) } }
          : {}),
      },
      include: POST_INCLUDE,
    });
    return toEntity(row);
  }

  async updateStatus(
    id: string,
    status: PostStatus,
    publishedAt: Date | null,
  ): Promise<PostEntity> {
    const row = await this.prisma.post.update({
      where: { id },
      data: { status, publishedAt },
      include: POST_INCLUDE,
    });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.post.delete({ where: { id } });
  }

  async promoteDuePosts(now: Date): Promise<string[]> {
    const due = await this.prisma.post.findMany({
      where: { status: 'SCHEDULED', publishedAt: { lte: now } },
      select: { id: true, slug: true },
    });
    if (due.length === 0) return [];

    await this.prisma.post.updateMany({
      where: { id: { in: due.map((post) => post.id) } },
      data: { status: 'PUBLISHED' },
    });

    return due.map((post) => post.slug);
  }
}
