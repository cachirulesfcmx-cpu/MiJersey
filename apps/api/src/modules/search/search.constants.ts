export const SEARCH_LOOKUP = Symbol('SEARCH_LOOKUP');
export const SEARCH_QUERY_LOG_REPOSITORY = Symbol('SEARCH_QUERY_LOG_REPOSITORY');
export const SEARCH_CLICK_LOG_REPOSITORY = Symbol('SEARCH_CLICK_LOG_REPOSITORY');
export const SEARCH_SYNONYM_REPOSITORY = Symbol('SEARCH_SYNONYM_REPOSITORY');

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
export const DEFAULT_SUGGESTIONS_LIMIT = 8;
export const MAX_SUGGESTIONS_LIMIT = 20;
export const DEFAULT_TRENDING_LIMIT = 10;
export const MAX_TRENDING_LIMIT = 30;
/** Tope de resultados de categorías/marcas/colecciones dentro de `/search` — productos son el resultado principal y paginado; el resto son "coincidencias rápidas". */
export const SECONDARY_RESULTS_LIMIT = 5;
/** Ventana de "trending" (spec §9 analítica) — búsquedas más antiguas no cuentan para el ranking de popularidad. */
export const TRENDING_WINDOW_DAYS = 7;
/** Ventana más amplia para el panel admin de "búsquedas sin resultados". */
export const ZERO_RESULT_WINDOW_DAYS = 30;
export const TRENDING_CACHE_TTL_SECONDS = 300;
export const TRENDING_CACHE_KEY = 'search:trending';
/** Umbral mínimo de `word_similarity()` (pg_trgm) para considerar un nombre "suficientemente parecido" al término buscado — calibrado contra typos reales de una palabra dentro de nombres de varias palabras. */
export const MIN_TRIGRAM_SIMILARITY = 0.3;
