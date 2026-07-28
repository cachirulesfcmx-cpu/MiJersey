import { Inject, Injectable } from '@nestjs/common';

import type {
  ListRedirectsResult,
  RedirectRepositoryPort,
} from '../../domain/ports/redirect.repository.port';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, REDIRECT_REPOSITORY } from '../../seo.constants';

export interface ListRedirectsInput {
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ListRedirectsUseCase {
  constructor(@Inject(REDIRECT_REPOSITORY) private readonly redirects: RedirectRepositoryPort) {}

  execute(input: ListRedirectsInput): Promise<ListRedirectsResult> {
    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize = Math.min(
      input.pageSize && input.pageSize > 0 ? input.pageSize : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );

    return this.redirects.findMany({ page, pageSize });
  }
}
