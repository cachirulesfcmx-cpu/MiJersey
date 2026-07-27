import { Inject, Injectable } from '@nestjs/common';

import { PRODUCT_QUERY } from '../../attributes.constants';
import type {
  ProductQueryPort,
  SearchProductsParams,
  SearchProductsResult,
} from '../../domain/ports/product-query.port';

@Injectable()
export class SearchProductsUseCase {
  constructor(@Inject(PRODUCT_QUERY) private readonly productQuery: ProductQueryPort) {}

  async execute(params: SearchProductsParams): Promise<SearchProductsResult> {
    return this.productQuery.searchProducts(params);
  }
}
