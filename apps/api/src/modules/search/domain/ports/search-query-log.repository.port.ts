export interface RecordSearchQueryData {
  term: string;
  normalizedTerm: string;
  resultsCount: number;
  sessionId?: string | null;
  customerId?: string | null;
}

export interface TrendingTerm {
  term: string;
  count: number;
}

export interface SearchQueryLogRepositoryPort {
  record(data: RecordSearchQueryData): Promise<void>;
  /** Términos más buscados desde `since`, agrupados por término normalizado. */
  findTrending(since: Date, limit: number): Promise<TrendingTerm[]>;
  /** Términos que consistentemente devuelven 0 resultados desde `since` — insumo del panel de analítica admin. */
  findZeroResultTerms(since: Date, limit: number): Promise<TrendingTerm[]>;
}
