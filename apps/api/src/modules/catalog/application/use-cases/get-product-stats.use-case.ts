import { Inject, Injectable } from '@nestjs/common';

import { PRODUCT_REPOSITORY } from '../../catalog.constants';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';

export interface ProductStats {
  total: number;
}

@Injectable()
export class GetProductStatsUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort) {}

  async execute(): Promise<ProductStats> {
    return { total: await this.products.count() };
  }
}
