import { Inject, Injectable } from '@nestjs/common';

import { SearchProductsUseCase } from '../../../attributes/application/use-cases/search-products.use-case';
import type { ProductSummary } from '../../../attributes/domain/ports/product-query.port';
import {
  DEFAULT_RELATED_PRODUCTS_LIMIT,
  PRODUCT_DETAIL_LOOKUP,
  PRODUCT_REPOSITORY,
} from '../../catalog.constants';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type { ProductDetailLookupPort } from '../../domain/ports/product-detail-lookup.port';
import { ProductStatus, ProductVisibility } from '../../domain/value-objects/product-enums';

/** Prioriza la primera categoría del producto; si no tiene ninguna, cae a su marca. Sin ninguna de las dos, no hay base de relevancia y se devuelve una lista vacía en vez de "populares" inventados. */
@Injectable()
export class GetRelatedProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(PRODUCT_DETAIL_LOOKUP) private readonly lookup: ProductDetailLookupPort,
    private readonly searchProducts: SearchProductsUseCase,
  ) {}

  async execute(slug: string, limit = DEFAULT_RELATED_PRODUCTS_LIMIT): Promise<ProductSummary[]> {
    const product = await this.products.findBySlug(slug);
    if (
      !product ||
      product.status !== ProductStatus.ACTIVE ||
      product.visibility !== ProductVisibility.PUBLIC
    ) {
      throw new ProductNotFoundError();
    }

    const relations = await this.lookup.findProductRelations(product.id);
    if (!relations.categoryIds[0] && !relations.brandId) {
      return [];
    }

    const result = await this.searchProducts.execute({
      filters: [],
      page: 1,
      pageSize: limit,
      excludeProductId: product.id,
      ...(relations.categoryIds[0]
        ? { categoryId: relations.categoryIds[0] }
        : { brandId: relations.brandId! }),
    });

    return result.items;
  }
}
