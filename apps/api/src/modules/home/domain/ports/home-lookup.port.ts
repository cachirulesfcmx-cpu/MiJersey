export interface ProductLookupSummary {
  id: string;
  slug: string;
  name: string;
  imageMediaId: string | null;
  fromPrice: number | null;
  /** `compareAtPrice` real de la variante usada para `fromPrice` — para el badge de descuento en el home (nunca inventado). */
  compareAtPrice: number | null;
}

export interface CategoryLookupSummary {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
}

export interface CollectionLookupSummary {
  id: string;
  slug: string;
  name: string;
}

export interface BrandLookupSummary {
  id: string;
  slug: string;
  name: string;
  logoMediaId: string | null;
}

/** Lectura propia de Home sobre tablas de Catalog/Taxonomy/Brands (Prisma directo, sin importar esos módulos) — mismo patrón que `SitemapSourcePort`/`EntityLookupPort` en SEO (012). */
export interface HomeLookupPort {
  findProductsByIds(ids: string[]): Promise<ProductLookupSummary[]>;
  findCategoriesByIds(ids: string[]): Promise<CategoryLookupSummary[]>;
  findCollectionsByIds(ids: string[]): Promise<CollectionLookupSummary[]>;
  findBrandsByIds(ids: string[]): Promise<BrandLookupSummary[]>;
}
