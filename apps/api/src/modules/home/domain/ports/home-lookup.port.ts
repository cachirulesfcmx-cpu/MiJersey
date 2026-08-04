export interface ProductLookupSummary {
  id: string;
  slug: string;
  name: string;
  imageMediaId: string | null;
  fromPrice: number | null;
  /** `compareAtPrice` real de la variante usada para `fromPrice` — para el badge de descuento en el home (nunca inventado). */
  compareAtPrice: number | null;
  /** Promedio real de `Review.rating` (APPROVED) — `null` si el producto no tiene reseñas todavía, nunca se inventa. */
  rating: number | null;
  reviewCount: number;
  /** Variante ACTIVE más barata — habilita "agregar al carrito" directo desde el home sin pasar por el PDP. */
  defaultVariantId: string | null;
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
