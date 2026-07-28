import { Inject, Injectable } from '@nestjs/common';

import { BRAND_REPOSITORY, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../brands.constants';
import type {
  BrandRepositoryPort,
  ListBrandsFilter,
  ListBrandsResult,
} from '../../domain/ports/brand.repository.port';

export interface ListBrandsInput {
  filter?: ListBrandsFilter;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ListBrandsUseCase {
  constructor(@Inject(BRAND_REPOSITORY) private readonly brands: BrandRepositoryPort) {}

  execute(input: ListBrandsInput): Promise<ListBrandsResult> {
    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize = Math.min(
      input.pageSize && input.pageSize > 0 ? input.pageSize : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );

    return this.brands.findMany({
      ...(input.filter ? { filter: input.filter } : {}),
      page,
      pageSize,
    });
  }
}
