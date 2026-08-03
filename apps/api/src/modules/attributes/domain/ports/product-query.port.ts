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
  /// Imagen de la variante activa más barata, ya resuelta a URL servible (mismo criterio que Home 013, ver HomeEnrichmentService).
  imageUrl: string | null;
  /// Precio de la variante activa más barata — null si el producto no tiene variantes activas.
  price: number | null;
  /// compareAtPrice de esa misma variante, para poder mostrar el descuento en el storefront.
  compareAtPrice: number | null;
}

/**
 * Alcance opcional reutilizado por categorías/marcas/búsqueda (014): el mismo
 * motor de `searchProducts`/`computeFacets` sirve de PLP para los tres, en
 * vez de reimplementar filtros facetados por separado en Taxonomy y Brands.
 */
export interface ProductListingScope {
  categoryId?: string;
  brandId?: string;
  /** Texto libre, buscado en `name`/`sku` (contains, insensible a mayúsculas). */
  search?: string;
  /** Excluye un producto puntual — usado por "productos relacionados" (015) para no listarse a sí mismo. */
  excludeProductId?: string;
}

export interface SearchProductsParams extends ProductListingScope {
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
  computeFacets(
    filters: AttributeFilterInput[],
    scope?: ProductListingScope,
  ): Promise<FacetResult[]>;
  searchProducts(params: SearchProductsParams): Promise<SearchProductsResult>;
}
