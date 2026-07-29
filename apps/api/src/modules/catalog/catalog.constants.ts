export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
export const PRODUCT_OPTION_REPOSITORY = Symbol('PRODUCT_OPTION_REPOSITORY');
export const PRODUCT_VARIANT_REPOSITORY = Symbol('PRODUCT_VARIANT_REPOSITORY');
export const PRODUCT_MEDIA_REPOSITORY = Symbol('PRODUCT_MEDIA_REPOSITORY');
export const PRODUCT_DETAIL_LOOKUP = Symbol('PRODUCT_DETAIL_LOOKUP');
export const INVENTORY_AVAILABILITY = Symbol('INVENTORY_AVAILABILITY');

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
/** Cuántas variantes puede tener como máximo un producto para que la PDP las traiga todas de una vez (sin paginar). */
export const MAX_PDP_VARIANTS = 100;
/** Cuántos "relacionados" se muestran por defecto en la PDP. */
export const DEFAULT_RELATED_PRODUCTS_LIMIT = 8;
