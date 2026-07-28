export enum SeoEntityType {
  PRODUCT = 'PRODUCT',
  CATEGORY = 'CATEGORY',
  COLLECTION = 'COLLECTION',
  BRAND = 'BRAND',
}

export enum SeoRobotsDirective {
  INDEX_FOLLOW = 'INDEX_FOLLOW',
  NOINDEX_FOLLOW = 'NOINDEX_FOLLOW',
  INDEX_NOFOLLOW = 'INDEX_NOFOLLOW',
  NOINDEX_NOFOLLOW = 'NOINDEX_NOFOLLOW',
}

export enum SeoTwitterCardType {
  SUMMARY = 'SUMMARY',
  SUMMARY_LARGE_IMAGE = 'SUMMARY_LARGE_IMAGE',
}

const ENTITY_PATH_PREFIX: Record<SeoEntityType, string> = {
  [SeoEntityType.PRODUCT]: '/products',
  [SeoEntityType.CATEGORY]: '/categories',
  [SeoEntityType.COLLECTION]: '/collections',
  [SeoEntityType.BRAND]: '/brands',
};

/** Ruta del storefront (apps/web) para una entidad — usada por el sitemap y por las redirecciones automáticas al cambiar un slug. */
export function buildEntityPath(entityType: SeoEntityType, slug: string): string {
  return `${ENTITY_PATH_PREFIX[entityType]}/${slug}`;
}
