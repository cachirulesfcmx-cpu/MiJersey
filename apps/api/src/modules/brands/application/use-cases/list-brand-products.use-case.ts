import { Inject, Injectable } from '@nestjs/common';

import {
  BRAND_REPOSITORY,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  PRODUCT_QUERY,
} from '../../brands.constants';
import { BrandNotFoundError } from '../../domain/errors/brand.errors';
import type { BrandRepositoryPort } from '../../domain/ports/brand.repository.port';
import type {
  BrandProductSortBy,
  ListBrandProductsResult,
  ProductQueryPort,
  SortDirection,
} from '../../domain/ports/product-query.port';
import { BrandStatus } from '../../domain/value-objects/brand-status';

export interface ListBrandProductsInput {
  brandId: string;
  page?: number;
  pageSize?: number;
  /** `true` para el listado público del storefront (solo productos ACTIVE + PUBLIC). */
  onlyPublic?: boolean;
  sortBy?: BrandProductSortBy;
  sortDir?: SortDirection;
}

@Injectable()
export class ListBrandProductsUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepositoryPort,
    @Inject(PRODUCT_QUERY) private readonly products: ProductQueryPort,
  ) {}

  async execute(input: ListBrandProductsInput): Promise<ListBrandProductsResult> {
    const brand = await this.brands.findById(input.brandId);
    if (!brand || (input.onlyPublic && brand.status !== BrandStatus.ACTIVE)) {
      throw new BrandNotFoundError();
    }

    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize = Math.min(
      input.pageSize && input.pageSize > 0 ? input.pageSize : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );

    return this.products.findByBrand({
      brandId: input.brandId,
      page,
      pageSize,
      ...(input.onlyPublic ? { onlyPublic: true } : {}),
      ...(input.sortBy ? { sortBy: input.sortBy } : {}),
      ...(input.sortDir ? { sortDir: input.sortDir } : {}),
    });
  }
}
