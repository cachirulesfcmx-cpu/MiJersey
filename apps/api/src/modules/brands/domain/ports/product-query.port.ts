export interface BrandProductSummary {
  id: string;
  sku: string;
  slug: string;
  name: string;
  status: string;
  visibility: string;
  createdAt: Date;
}

export type BrandProductSortBy = 'name' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface ListBrandProductsParams {
  brandId: string;
  page: number;
  pageSize: number;
  /** `true` para el storefront público: solo productos ACTIVE + PUBLIC. */
  onlyPublic?: boolean;
  sortBy?: BrandProductSortBy;
  sortDir?: SortDirection;
}

export interface ListBrandProductsResult {
  items: BrandProductSummary[];
  total: number;
}

/**
 * Vista de solo lectura de Product para Brands (mismo patrón CQRS que
 * `ProductQueryPort` de Taxonomy) — Catalog es dueño de la tabla, Brands solo
 * la consulta para validar asociaciones y listar productos por marca. La
 * única excepción es la columna `brandId`, que Brands posee en exclusiva
 * (igual que Taxonomy posee en exclusiva la tabla `product_categories`).
 */
export interface ProductQueryPort {
  exists(productId: string): Promise<boolean>;
  findByIds(productIds: string[]): Promise<BrandProductSummary[]>;
  countByBrand(brandId: string): Promise<number>;
  findByBrand(params: ListBrandProductsParams): Promise<ListBrandProductsResult>;
  assignToBrand(productIds: string[], brandId: string): Promise<void>;
  unassignFromBrand(productIds: string[]): Promise<void>;
  unassignAllFromBrand(brandId: string): Promise<void>;
}
