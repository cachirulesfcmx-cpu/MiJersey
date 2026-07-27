export const WAREHOUSE_REPOSITORY = Symbol('WAREHOUSE_REPOSITORY');
export const INVENTORY_ITEM_REPOSITORY = Symbol('INVENTORY_ITEM_REPOSITORY');
export const INVENTORY_MOVEMENT_REPOSITORY = Symbol('INVENTORY_MOVEMENT_REPOSITORY');
export const VARIANT_QUERY = Symbol('VARIANT_QUERY');

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Reintentos ante conflicto de bloqueo optimista antes de reportar el error al cliente. */
export const MAX_CONCURRENCY_RETRIES = 3;
