import { Inject, Injectable } from '@nestjs/common';

import { PRODUCT_REPOSITORY } from '../../catalog.constants';
import type { ProductEntity } from '../../domain/entities/product.entity';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';

@Injectable()
export class GetProductUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort) {}

  async execute(id: string): Promise<ProductEntity> {
    const product = await this.products.findById(id);
    if (!product) {
      throw new ProductNotFoundError();
    }
    return product;
  }
}
