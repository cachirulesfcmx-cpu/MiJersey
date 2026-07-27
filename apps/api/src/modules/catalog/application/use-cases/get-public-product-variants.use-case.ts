import { Inject, Injectable } from '@nestjs/common';

import { PRODUCT_REPOSITORY, PRODUCT_VARIANT_REPOSITORY } from '../../catalog.constants';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type {
  ListVariantsResult,
  ProductVariantRepositoryPort,
} from '../../domain/ports/product-variant.repository.port';
import { ProductStatus, ProductVisibility } from '../../domain/value-objects/product-enums';

export interface GetPublicProductVariantsInput {
  slug: string;
  page: number;
  pageSize: number;
}

/** Solo variantes ACTIVE de un producto ACTIVE + PUBLIC. */
@Injectable()
export class GetPublicProductVariantsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variants: ProductVariantRepositoryPort,
  ) {}

  async execute(input: GetPublicProductVariantsInput): Promise<ListVariantsResult> {
    const product = await this.products.findBySlug(input.slug);

    if (
      !product ||
      product.status !== ProductStatus.ACTIVE ||
      product.visibility !== ProductVisibility.PUBLIC
    ) {
      throw new ProductNotFoundError();
    }

    return this.variants.findManyPublic(product.id, input.page, input.pageSize);
  }
}
