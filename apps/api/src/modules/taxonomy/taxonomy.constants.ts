export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');
export const COLLECTION_REPOSITORY = Symbol('COLLECTION_REPOSITORY');
export const PRODUCT_QUERY = Symbol('PRODUCT_QUERY');

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Profundidad máxima del árbol de categorías (raíz = profundidad 0). */
export const MAX_CATEGORY_DEPTH = 5;

/** TTL de la caché de navegación pública (árbol de categorías, listado de colecciones). */
export const PUBLIC_CACHE_TTL_SECONDS = 60;
