import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import { PAGE_REPOSITORY, PAGE_VERSION_REPOSITORY } from '../../cms.constants';
import type { PageVersionEntity } from '../../domain/entities/page-version.entity';
import { PageNotFoundError } from '../../domain/errors/cms.errors';
import type { PageRepositoryPort } from '../../domain/ports/page.repository.port';
import type { PageVersionRepositoryPort } from '../../domain/ports/page-version.repository.port';

export interface ListPageVersionsInput extends PaginationParams {
  pageId: string;
}

@Injectable()
export class ListPageVersionsUseCase {
  constructor(
    @Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort,
    @Inject(PAGE_VERSION_REPOSITORY) private readonly versions: PageVersionRepositoryPort,
  ) {}

  async execute(input: ListPageVersionsInput): Promise<PaginatedResult<PageVersionEntity>> {
    const page = await this.pages.findById(input.pageId);
    if (!page) throw new PageNotFoundError();

    return this.versions.findMany(input.pageId, { page: input.page, pageSize: input.pageSize });
  }
}
