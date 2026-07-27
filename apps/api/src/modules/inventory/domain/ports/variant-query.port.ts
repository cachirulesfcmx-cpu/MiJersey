export interface VariantSummary {
  id: string;
  productId: string;
  sku: string;
  title: string;
  productName: string;
  status: string;
}

export interface SearchVariantsResult {
  items: VariantSummary[];
  total: number;
}

/**
 * Vista de solo lectura de ProductVariant para el módulo Inventory (mismo
 * patrón CQRS que Taxonomy/Attributes): lee `product_variants`/`products` vía
 * Prisma directo, sin importar CatalogModule ni sus entidades de dominio.
 */
export interface VariantQueryPort {
  exists(variantId: string): Promise<boolean>;
  findById(variantId: string): Promise<VariantSummary | null>;
  findByIds(variantIds: string[]): Promise<VariantSummary[]>;
  /** Búsqueda por SKU/título de variante o nombre de producto — usada por el listado admin de inventario. */
  search(query: string, page: number, pageSize: number): Promise<SearchVariantsResult>;
}
