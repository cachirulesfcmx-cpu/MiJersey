import { Inject, Injectable } from '@nestjs/common';

import { PAGE_REPOSITORY } from '../../cms.constants';
import type { PageEntity } from '../../domain/entities/page.entity';
import { PageNotFoundError } from '../../domain/errors/cms.errors';
import type { PageRepositoryPort } from '../../domain/ports/page.repository.port';

@Injectable()
export class GetPageUseCase {
  constructor(@Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort) {}

  async execute(id: string): Promise<PageEntity> {
    const page = await this.pages.findById(id);
    if (!page) throw new PageNotFoundError();
    return page;
  }
}
