import type { PaginatedResult } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import { PAGE_REPOSITORY } from '../../cms.constants';
import type { PageEntity } from '../../domain/entities/page.entity';
import type { ListPagesParams, PageRepositoryPort } from '../../domain/ports/page.repository.port';

@Injectable()
export class ListPagesUseCase {
  constructor(@Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort) {}

  async execute(params: ListPagesParams): Promise<PaginatedResult<PageEntity>> {
    return this.pages.findMany(params);
  }
}
