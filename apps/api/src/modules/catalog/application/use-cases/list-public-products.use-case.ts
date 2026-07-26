import { Inject, Injectable } from '@nestjs/common';

import { PRODUCT_REPOSITORY } from '../../catalog.constants';
import type {
  ListProductsResult,
  ProductRepositoryPort,
} from '../../domain/ports/product.repository.port';

export interface ListPublicProductsInput {
  search?: string;
  page: number;
  pageSize: number;
}

/** Igual que ListProductsUseCase, pero fuerza `publicOnly` sin importar lo que envíe el cliente. */
@Injectable()
export class ListPublicProductsUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort) {}

  execute(input: ListPublicProductsInput): Promise<ListProductsResult> {
    return this.products.findMany({
      filter: { publicOnly: true, ...(input.search ? { search: input.search } : {}) },
      page: input.page,
      pageSize: input.pageSize,
    });
  }
}
