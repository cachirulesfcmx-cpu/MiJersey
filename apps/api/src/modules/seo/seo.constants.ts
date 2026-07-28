export const SEO_METADATA_REPOSITORY = Symbol('SEO_METADATA_REPOSITORY');
export const REDIRECT_REPOSITORY = Symbol('REDIRECT_REPOSITORY');
export const SITEMAP_SOURCE = Symbol('SITEMAP_SOURCE');
export const ENTITY_LOOKUP = Symbol('ENTITY_LOOKUP');

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** TTL del sitemap cacheado en Redis (spec §9 "generación eficiente de sitemaps"). */
export const SITEMAP_CACHE_TTL_SECONDS = 600;
export const SITEMAP_CACHE_KEY = 'seo:sitemap:xml';
