import { Inject, Injectable } from '@nestjs/common';

import { PRODUCT_QUERY } from '../../attributes.constants';
import type {
  AttributeFilterInput,
  FacetResult,
  ProductQueryPort,
} from '../../domain/ports/product-query.port';
import { AttributeCacheService } from '../services/attribute-cache.service';

@Injectable()
export class GetFiltersUseCase {
  constructor(
    @Inject(PRODUCT_QUERY) private readonly productQuery: ProductQueryPort,
    private readonly cache: AttributeCacheService,
  ) {}

  async execute(filters: AttributeFilterInput[]): Promise<FacetResult[]> {
    if (filters.length === 0) {
      const cached = await this.cache.getDefaultFacets();
      if (cached) {
        return JSON.parse(cached) as FacetResult[];
      }
    }

    const facets = await this.productQuery.computeFacets(filters);

    if (filters.length === 0) {
      await this.cache.setDefaultFacets(JSON.stringify(facets));
    }

    return facets;
  }
}
