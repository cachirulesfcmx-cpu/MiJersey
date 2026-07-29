export type SearchResultType = 'PRODUCT' | 'CATEGORY' | 'BRAND' | 'COLLECTION';

export interface SearchResultItem {
  id: string;
  slug: string;
  name: string;
  sku?: string;
  type: SearchResultType;
}

export interface SearchParams {
  q: string;
  page?: number;
  pageSize?: number;
  /** Id anónimo generado por el storefront y persistido en localStorage — no existe todavía un concepto de sesión de invitado en el backend. */
  sessionId?: string;
}

export interface SearchResult {
  products: { items: SearchResultItem[]; total: number; page: number; pageSize: number };
  categories: SearchResultItem[];
  brands: SearchResultItem[];
  collections: SearchResultItem[];
}

export interface SearchSuggestionsParams {
  q: string;
  limit?: number;
}

export interface TrendingTerm {
  term: string;
  count: number;
}

export interface LogSearchClickInput {
  term: string;
  entityType: SearchResultType;
  entityId: string;
  sessionId?: string;
}

export interface SearchSynonym {
  id: string;
  term: string;
  synonyms: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSearchSynonymInput {
  term: string;
  synonyms: string[];
}

export interface UpdateSearchSynonymInput {
  term?: string;
  synonyms?: string[];
}

export interface SearchAnalytics {
  topTerms: TrendingTerm[];
  zeroResultTerms: TrendingTerm[];
}
