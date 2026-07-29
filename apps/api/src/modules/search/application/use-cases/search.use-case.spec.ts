import type { SearchLookupPort } from '../../domain/ports/search-lookup.port';
import { SearchResultType } from '../../domain/value-objects/search-enums';
import { SearchUseCase } from './search.use-case';

function buildUseCase(overrides: {
  productsTotal?: number;
  fuzzyTotal?: number;
  expansions?: string[];
}) {
  const lookup: jest.Mocked<SearchLookupPort> = {
    searchProducts: jest.fn().mockResolvedValue({
      items:
        overrides.productsTotal && overrides.productsTotal > 0
          ? [
              {
                id: 'p1',
                slug: 'jersey',
                name: 'Jersey',
                sku: 'JR-1',
                type: SearchResultType.PRODUCT,
              },
            ]
          : [],
      total: overrides.productsTotal ?? 0,
    }),
    searchProductsFuzzy: jest.fn().mockResolvedValue({
      items:
        overrides.fuzzyTotal && overrides.fuzzyTotal > 0
          ? [
              {
                id: 'p2',
                slug: 'jersey-2',
                name: 'Jersey 2',
                sku: 'JR-2',
                type: SearchResultType.PRODUCT,
              },
            ]
          : [],
      total: overrides.fuzzyTotal ?? 0,
    }),
    searchCategories: jest.fn().mockResolvedValue([]),
    searchBrands: jest.fn().mockResolvedValue([]),
    searchCollections: jest.fn().mockResolvedValue([]),
    suggestProductNames: jest.fn(),
  };
  const queryLog = {
    record: jest.fn().mockResolvedValue(undefined),
    findTrending: jest.fn(),
    findZeroResultTerms: jest.fn(),
  };
  const synonyms = {
    findExpansions: jest.fn().mockResolvedValue(overrides.expansions ?? ['jersey']),
    findById: jest.fn(),
    findByTerm: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  return { useCase: new SearchUseCase(lookup, queryLog, synonyms), lookup, queryLog, synonyms };
}

describe('SearchUseCase', () => {
  it('returns empty results without querying when the term is blank', async () => {
    const { useCase, lookup, queryLog } = buildUseCase({});

    const result = await useCase.execute({ term: '   ' });

    expect(result).toEqual({
      products: { items: [], total: 0, page: 1, pageSize: 20 },
      categories: [],
      brands: [],
      collections: [],
    });
    expect(lookup.searchProducts).not.toHaveBeenCalled();
    expect(queryLog.record).not.toHaveBeenCalled();
  });

  it('expands the term via synonyms before searching', async () => {
    const { useCase, lookup, synonyms } = buildUseCase({
      productsTotal: 1,
      expansions: ['jersey', 'camiseta'],
    });

    await useCase.execute({ term: 'Jersey' });

    expect(synonyms.findExpansions).toHaveBeenCalledWith('jersey');
    expect(lookup.searchProducts).toHaveBeenCalledWith(['jersey', 'camiseta'], 1, 20);
  });

  it('falls back to fuzzy search when the exact match finds nothing', async () => {
    const { useCase, lookup } = buildUseCase({ productsTotal: 0, fuzzyTotal: 1 });

    const result = await useCase.execute({ term: 'jersey' });

    expect(lookup.searchProductsFuzzy).toHaveBeenCalledWith('jersey', 1, 20);
    expect(result.products.total).toBe(1);
  });

  it('does not call the fuzzy fallback when the exact match already found results', async () => {
    const { useCase, lookup } = buildUseCase({ productsTotal: 1 });

    await useCase.execute({ term: 'jersey' });

    expect(lookup.searchProductsFuzzy).not.toHaveBeenCalled();
  });

  it('records the query with the total results across all entity types', async () => {
    const { useCase, queryLog } = buildUseCase({ productsTotal: 1 });

    await useCase.execute({ term: 'jersey', sessionId: 'session-1' });

    expect(queryLog.record).toHaveBeenCalledWith({
      term: 'jersey',
      normalizedTerm: 'jersey',
      resultsCount: 1,
      sessionId: 'session-1',
      customerId: null,
    });
  });
});
