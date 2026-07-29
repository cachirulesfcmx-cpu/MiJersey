import { Inject, Injectable } from '@nestjs/common';

import type { SearchLookupPort, SearchResultItem } from '../../domain/ports/search-lookup.port';
import type { SearchQueryLogRepositoryPort } from '../../domain/ports/search-query-log.repository.port';
import type { SearchSynonymRepositoryPort } from '../../domain/ports/search-synonym.repository.port';
import {
  DEFAULT_PAGE_SIZE,
  SEARCH_LOOKUP,
  SEARCH_QUERY_LOG_REPOSITORY,
  SEARCH_SYNONYM_REPOSITORY,
  SECONDARY_RESULTS_LIMIT,
} from '../../search.constants';

export interface SearchInput {
  term: string;
  page?: number;
  pageSize?: number;
  sessionId?: string;
  customerId?: string;
}

export interface SearchResult {
  products: { items: SearchResultItem[]; total: number; page: number; pageSize: number };
  categories: SearchResultItem[];
  brands: SearchResultItem[];
  collections: SearchResultItem[];
}

/** Motor de búsqueda global (016): productos (paginados, resultado principal) + categorías/marcas/colecciones (coincidencias rápidas, tope fijo). */
@Injectable()
export class SearchUseCase {
  constructor(
    @Inject(SEARCH_LOOKUP) private readonly lookup: SearchLookupPort,
    @Inject(SEARCH_QUERY_LOG_REPOSITORY) private readonly queryLog: SearchQueryLogRepositoryPort,
    @Inject(SEARCH_SYNONYM_REPOSITORY) private readonly synonyms: SearchSynonymRepositoryPort,
  ) {}

  async execute(input: SearchInput): Promise<SearchResult> {
    const term = input.term.trim();
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;

    if (!term) {
      return {
        products: { items: [], total: 0, page, pageSize },
        categories: [],
        brands: [],
        collections: [],
      };
    }

    const normalizedTerm = term.toLowerCase();
    const terms = await this.synonyms.findExpansions(normalizedTerm);

    let products = await this.lookup.searchProducts(terms, page, pageSize);
    if (products.total === 0) {
      products = await this.lookup.searchProductsFuzzy(term, page, pageSize);
    }

    const [categories, brands, collections] = await Promise.all([
      this.lookup.searchCategories(terms, SECONDARY_RESULTS_LIMIT),
      this.lookup.searchBrands(terms, SECONDARY_RESULTS_LIMIT),
      this.lookup.searchCollections(terms, SECONDARY_RESULTS_LIMIT),
    ]);

    await this.queryLog.record({
      term,
      normalizedTerm,
      resultsCount: products.total + categories.length + brands.length + collections.length,
      sessionId: input.sessionId ?? null,
      customerId: input.customerId ?? null,
    });

    return {
      products: { items: products.items, total: products.total, page, pageSize },
      categories,
      brands,
      collections,
    };
  }
}
