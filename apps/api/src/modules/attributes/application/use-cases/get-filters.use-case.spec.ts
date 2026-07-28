import type { FacetResult, ProductQueryPort } from '../../domain/ports/product-query.port';
import type { AttributeCacheService } from '../services/attribute-cache.service';
import { GetFiltersUseCase } from './get-filters.use-case';

function buildUseCase(cachedFacets: string | null = null) {
  const productQuery: jest.Mocked<ProductQueryPort> = {
    exists: jest.fn(),
    computeFacets: jest.fn().mockResolvedValue([] as FacetResult[]),
    searchProducts: jest.fn(),
  };
  const cache = {
    getDefaultFacets: jest.fn().mockResolvedValue(cachedFacets),
    setDefaultFacets: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AttributeCacheService>;

  return { useCase: new GetFiltersUseCase(productQuery, cache), productQuery, cache };
}

describe('GetFiltersUseCase', () => {
  it('uses the cached default facets when there are no filters and no scope', async () => {
    const cached: FacetResult[] = [
      {
        attributeId: 'a1',
        code: 'color',
        name: 'Color',
        type: 'COLOR',
        isComparable: false,
        values: [],
      },
    ];
    const { useCase, productQuery } = buildUseCase(JSON.stringify(cached));

    const result = await useCase.execute([]);

    expect(result).toEqual(cached);
    expect(productQuery.computeFacets).not.toHaveBeenCalled();
  });

  it('bypasses the cache when a category/brand/search scope is given, even with no filters', async () => {
    const { useCase, productQuery, cache } = buildUseCase('should-not-be-used');

    await useCase.execute([], { categoryId: 'cat-1' });

    expect(productQuery.computeFacets).toHaveBeenCalledWith([], { categoryId: 'cat-1' });
    expect(cache.setDefaultFacets).not.toHaveBeenCalled();
  });

  it('bypasses the cache when filters are present', async () => {
    const { useCase, productQuery, cache } = buildUseCase();

    await useCase.execute([{ attributeId: 'a1', valueIds: ['v1'] }]);

    expect(productQuery.computeFacets).toHaveBeenCalled();
    expect(cache.setDefaultFacets).not.toHaveBeenCalled();
  });

  it('stores the computed facets in cache only for the unscoped, filter-less case', async () => {
    const { useCase, cache } = buildUseCase();

    await useCase.execute([]);

    expect(cache.setDefaultFacets).toHaveBeenCalledWith(JSON.stringify([]));
  });
});
