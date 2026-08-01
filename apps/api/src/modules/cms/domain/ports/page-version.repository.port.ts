import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { PageVersionEntity } from '../entities/page-version.entity';
import type { PageSnapshot } from '../entities/page-version.entity';

export interface CreatePageVersionData {
  pageId: string;
  snapshot: PageSnapshot;
}

export interface PageVersionRepositoryPort {
  findByPageAndNumber(pageId: string, versionNumber: number): Promise<PageVersionEntity | null>;
  findMany(pageId: string, params: PaginationParams): Promise<PaginatedResult<PageVersionEntity>>;
  getNextVersionNumber(pageId: string): Promise<number>;
  create(data: CreatePageVersionData): Promise<PageVersionEntity>;
}
