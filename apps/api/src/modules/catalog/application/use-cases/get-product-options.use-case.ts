import { Inject, Injectable } from '@nestjs/common';

import { PRODUCT_OPTION_REPOSITORY, PRODUCT_REPOSITORY } from '../../catalog.constants';
import type { ProductOptionEntity } from '../../domain/entities/product-option.entity';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type { ProductOptionRepositoryPort } from '../../domain/ports/product-option.repository.port';

@Injectable()
export class GetProductOptionsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(PRODUCT_OPTION_REPOSITORY) private readonly options: ProductOptionRepositoryPort,
  ) {}

  async execute(productId: string): Promise<ProductOptionEntity[]> {
    if (!(await this.products.findById(productId))) {
      throw new ProductNotFoundError();
    }

    return this.options.findByProductId(productId);
  }
}
