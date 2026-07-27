import { Inject, Injectable } from '@nestjs/common';

import { PRODUCT_VARIANT_REPOSITORY } from '../../catalog.constants';
import type {
  ListVariantsParams,
  ListVariantsResult,
  ProductVariantRepositoryPort,
} from '../../domain/ports/product-variant.repository.port';

@Injectable()
export class ListProductVariantsUseCase {
  constructor(
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variants: ProductVariantRepositoryPort,
  ) {}

  execute(params: ListVariantsParams): Promise<ListVariantsResult> {
    return this.variants.findMany(params);
  }
}
