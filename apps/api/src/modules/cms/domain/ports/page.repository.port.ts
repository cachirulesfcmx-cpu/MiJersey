import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { PageEntity } from '../entities/page.entity';
import type { PageStatus } from '../value-objects/page-enums';

export interface PageBlockInput {
  type: string;
  position: number;
  config: Record<string, unknown>;
}

export interface CreatePageData {
  title: string;
  slug: string;
  template?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  blocks: PageBlockInput[];
}

export interface UpdatePageData {
  title?: string;
  slug?: string;
  template?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  blocks?: PageBlockInput[];
}

export interface ListPagesParams extends PaginationParams {
  status?: PageStatus;
}

export interface PageRepositoryPort {
  findById(id: string): Promise<PageEntity | null>;
  findBySlug(slug: string): Promise<PageEntity | null>;
  findMany(params: ListPagesParams): Promise<PaginatedResult<PageEntity>>;
  create(data: CreatePageData): Promise<PageEntity>;
  update(id: string, data: UpdatePageData): Promise<PageEntity>;
  updateStatus(id: string, status: PageStatus, publishedAt: Date | null): Promise<PageEntity>;
  delete(id: string): Promise<void>;
}
