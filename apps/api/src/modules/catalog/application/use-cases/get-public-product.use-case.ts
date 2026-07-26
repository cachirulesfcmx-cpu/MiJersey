import { Inject, Injectable } from '@nestjs/common';

import { PRODUCT_REPOSITORY } from '../../catalog.constants';
import type { ProductEntity } from '../../domain/entities/product.entity';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import { ProductStatus, ProductVisibility } from '../../domain/value-objects/product-enums';

/** Igual que GetProductUseCase, pero solo expone productos publicados y visibles al público. */
@Injectable()
export class GetPublicProductUseCase {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort) {}

  async execute(slug: string): Promise<ProductEntity> {
    const product = await this.products.findBySlug(slug);

    if (
      !product ||
      product.status !== ProductStatus.ACTIVE ||
      product.visibility !== ProductVisibility.PUBLIC
    ) {
      throw new ProductNotFoundError();
    }

    return product;
  }
}
