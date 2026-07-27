export interface AttributeFilterInput {
  attributeId: string;
  valueIds?: string[];
  customValues?: string[];
}

export interface FacetValue {
  valueId: string | null;
  value: string;
  label: string;
  count: number;
}

export interface FacetResult {
  attributeId: string;
  code: string;
  name: string;
  type: string;
  isComparable: boolean;
  values: FacetValue[];
}

export interface ProductSummary {
  id: string;
  sku: string;
  slug: string;
  name: string;
  status: string;
  visibility: string;
  createdAt: Date;
}

export interface SearchProductsParams {
  filters: AttributeFilterInput[];
  page: number;
  pageSize: number;
  sortBy?: 'name' | 'createdAt';
  sortDir?: 'asc' | 'desc';
}

export interface SearchProductsResult {
  items: ProductSummary[];
  total: number;
}

/**
 * Vista de solo lectura de Product para el módulo Attributes (mismo patrón
 * CQRS que Taxonomy en 006): lee `products`/`product_attributes` vía Prisma
 * directo, sin importar CatalogModule ni sus entidades de dominio.
 */
export interface ProductQueryPort {
  exists(productId: string): Promise<boolean>;
  computeFacets(filters: AttributeFilterInput[]): Promise<FacetResult[]>;
  searchProducts(params: SearchProductsParams): Promise<SearchProductsResult>;
}
