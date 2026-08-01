import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { PostEntity } from '../entities/post.entity';
import type { PostStatus } from '../value-objects/post-enums';

export interface CreatePostData {
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  featuredImage?: string | null;
  authorId: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  categoryIds: string[];
  tagIds: string[];
}

export interface UpdatePostData {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  content?: string;
  featuredImage?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  categoryIds?: string[];
  tagIds?: string[];
}

export interface ListPostsParams extends PaginationParams {
  status?: PostStatus;
}

export interface ListPublishedPostsParams extends PaginationParams {
  categorySlug?: string;
  tagSlug?: string;
}

export interface PostRepositoryPort {
  findById(id: string): Promise<PostEntity | null>;
  findBySlug(slug: string): Promise<PostEntity | null>;
  findMany(params: ListPostsParams): Promise<PaginatedResult<PostEntity>>;
  findManyPublished(params: ListPublishedPostsParams): Promise<PaginatedResult<PostEntity>>;
  findPublishedCandidatesForRelated(
    postId: string,
    categoryIds: string[],
    tagIds: string[],
  ): Promise<PostEntity[]>;
  create(data: CreatePostData): Promise<PostEntity>;
  update(id: string, data: UpdatePostData): Promise<PostEntity>;
  updateStatus(id: string, status: PostStatus, publishedAt: Date | null): Promise<PostEntity>;
  delete(id: string): Promise<void>;
  /** Promueve a `PUBLISHED` los artículos `SCHEDULED` cuya `publishedAt` ya llegó (spec §4 "Permitir programación de publicaciones") — mismo criterio "derivar y persistir en la lectura" que CMS Pages (026), aplicado en lote para no dejar el listado público desactualizado. Devuelve los slugs promovidos para que el caso de uso invalide su caché. */
  promoteDuePosts(now: Date): Promise<string[]>;
}
