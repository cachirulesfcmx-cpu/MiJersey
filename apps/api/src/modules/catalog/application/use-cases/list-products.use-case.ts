import { Inject, Injectable } from '@nestjs/common';

import { PRODUCT_REPOSITORY } from '../../catalog.constants';
import type {
  ListProductsParams,
  ListProductsResult,
  ProductRepositoryPort,
} from '../../domain/ports/product.repository.port';

@Injectable()
export class ListProductsUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort) {}

  execute(params: ListProductsParams): Promise<ListProductsResult> {
    return this.products.findMany(params);
  }
}
