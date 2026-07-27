import { Inject, Injectable } from '@nestjs/common';

import { PRODUCT_VARIANT_REPOSITORY } from '../../catalog.constants';
import type { ProductVariantEntity } from '../../domain/entities/product-variant.entity';
import { ProductVariantNotFoundError } from '../../domain/errors/catalog.errors';
import type { ProductVariantRepositoryPort } from '../../domain/ports/product-variant.repository.port';

@Injectable()
export class GetProductVariantUseCase {
  constructor(
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variants: ProductVariantRepositoryPort,
  ) {}

  async execute(id: string): Promise<ProductVariantEntity> {
    const variant = await this.variants.findById(id);
    if (!variant) {
      throw new ProductVariantNotFoundError();
    }
    return variant;
  }
}
