export interface BrandSummary {
  id: string;
  slug: string;
  name: string;
  logoMediaId: string | null;
}

export interface CategorySummary {
  id: string;
  slug: string;
  name: string;
}

export interface ProductRelations {
  brandId: string | null;
  categoryIds: string[];
}

/**
 * Lectura propia de Catalog sobre `brands`/`categories`/`product_categories` vía Prisma
 * directo — sin importar BrandsModule/TaxonomyModule, mismo patrón CQRS que
 * `HomeLookupPort` (013) y `SitemapSourcePort` (012). Solo para enriquecer la PDP pública
 * con el nombre de marca/categoría; `ProductEntity` sigue sin exponer `brandId` (011).
 */
export interface ProductDetailLookupPort {
  findProductRelations(productId: string): Promise<ProductRelations>;
  findBrandSummary(brandId: string): Promise<BrandSummary | null>;
  findCategorySummaries(categoryIds: string[]): Promise<CategorySummary[]>;
}
