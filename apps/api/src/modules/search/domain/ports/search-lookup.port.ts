import type { SearchResultType } from '../value-objects/search-enums';

export interface SearchResultItem {
  id: string;
  slug: string;
  name: string;
  sku?: string;
  type: SearchResultType;
}

export interface SearchProductsResult {
  items: SearchResultItem[];
  total: number;
}

/** Lectura propia de Search sobre las tablas físicas de Catalog/Taxonomy/Brands — mismo patrón CQRS de puertos de solo lectura usado en sprints anteriores (015 `ProductDetailLookupPort`, 013 `HomeLookupPort`), en vez de importar esos módulos. */
export interface SearchLookupPort {
  /** `terms` ya viene expandido con sinónimos. Aplica `ILIKE` sobre nombre/SKU/descripción; si no hay resultados, el caso de uso reintenta con `searchProductsFuzzy`. */
  searchProducts(terms: string[], page: number, pageSize: number): Promise<SearchProductsResult>;
  /** Reintento con tolerancia a errores tipográficos (similarity de pg_trgm) — solo se usa cuando `searchProducts` no encontró nada. */
  searchProductsFuzzy(term: string, page: number, pageSize: number): Promise<SearchProductsResult>;
  searchCategories(terms: string[], limit: number): Promise<SearchResultItem[]>;
  searchBrands(terms: string[], limit: number): Promise<SearchResultItem[]>;
  searchCollections(terms: string[], limit: number): Promise<SearchResultItem[]>;
  /** Autocompletado: nombres de producto que empiezan con `prefix`; con tolerancia a errores si el prefijo no matchea nada. */
  suggestProductNames(prefix: string, limit: number): Promise<SearchResultItem[]>;
}
