export const NAVIGATION_MENU_REPOSITORY = Symbol('NAVIGATION_MENU_REPOSITORY');
export const NAVIGATION_VERSION_REPOSITORY = Symbol('NAVIGATION_VERSION_REPOSITORY');
export const NAVIGATION_LOOKUP = Symbol('NAVIGATION_LOOKUP');

/** TTL de la caché pública de menús renderizados — mismo criterio que `PUBLIC_CACHE_TTL_SECONDS` de CMS Pages (026) y Blog (027). */
export const PUBLIC_CACHE_TTL_SECONDS = 60;

/** Profundidad máxima del árbol (spec §4 "Soportar profundidad configurable de niveles") — 3 niveles alcanza para menú > mega menú > columna, suficiente para el criterio de aceptación sin un límite arbitrario mayor. */
export const MAX_NAVIGATION_DEPTH = 3;
