export const POST_REPOSITORY = Symbol('POST_REPOSITORY');
export const POST_VERSION_REPOSITORY = Symbol('POST_VERSION_REPOSITORY');
export const BLOG_CATEGORY_REPOSITORY = Symbol('BLOG_CATEGORY_REPOSITORY');
export const BLOG_TAG_REPOSITORY = Symbol('BLOG_TAG_REPOSITORY');

/** TTL de la caché pública de artículos — mismo criterio que `PUBLIC_CACHE_TTL_SECONDS` de CMS Pages (026) y Taxonomy (006). */
export const PUBLIC_CACHE_TTL_SECONDS = 60;

/** Tope de artículos relacionados devueltos por `GetRelatedPostsUseCase` (spec §4). */
export const RELATED_POSTS_LIMIT = 4;
