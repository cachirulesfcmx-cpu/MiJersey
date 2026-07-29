import { Inject, Injectable } from '@nestjs/common';

import type { SearchLookupPort, SearchResultItem } from '../../domain/ports/search-lookup.port';
import { DEFAULT_SUGGESTIONS_LIMIT, SEARCH_LOOKUP } from '../../search.constants';

/** Autocompletado (016 §6): se enfoca en nombres de producto — el caso de uso dominante. Categorías/marcas/colecciones ya aparecen agrupadas en `/search`, no se duplican en el dropdown. */
@Injectable()
export class GetSearchSuggestionsUseCase {
  constructor(@Inject(SEARCH_LOOKUP) private readonly lookup: SearchLookupPort) {}

  execute(prefix: string, limit = DEFAULT_SUGGESTIONS_LIMIT): Promise<SearchResultItem[]> {
    const trimmed = prefix.trim();
    if (!trimmed) return Promise.resolve([]);
    return this.lookup.suggestProductNames(trimmed, limit);
  }
}
