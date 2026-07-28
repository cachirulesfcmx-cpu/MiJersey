import { Inject, Injectable } from '@nestjs/common';

import { PRODUCT_QUERY } from '../../attributes.constants';
import type {
  AttributeFilterInput,
  FacetResult,
  ProductListingScope,
  ProductQueryPort,
} from '../../domain/ports/product-query.port';
import { AttributeCacheService } from '../services/attribute-cache.service';

function isUnscoped(filters: AttributeFilterInput[], scope?: ProductListingScope): boolean {
  return filters.length === 0 && !scope?.categoryId && !scope?.brandId && !scope?.search;
}

@Injectable()
export class GetFiltersUseCase {
  constructor(
    @Inject(PRODUCT_QUERY) private readonly productQuery: ProductQueryPort,
    private readonly cache: AttributeCacheService,
  ) {}

  /** Solo el conjunto de facetas global (sin filtros ni alcance de categoría/marca/búsqueda) se cachea — un cálculo por combinación de alcance saturaría la caché sin el beneficio real. */
  async execute(
    filters: AttributeFilterInput[],
    scope?: ProductListingScope,
  ): Promise<FacetResult[]> {
    const unscoped = isUnscoped(filters, scope);

    if (unscoped) {
      const cached = await this.cache.getDefaultFacets();
      if (cached) {
        return JSON.parse(cached) as FacetResult[];
      }
    }

    const facets = await this.productQuery.computeFacets(filters, scope);

    if (unscoped) {
      await this.cache.setDefaultFacets(JSON.stringify(facets));
    }

    return facets;
  }
}
