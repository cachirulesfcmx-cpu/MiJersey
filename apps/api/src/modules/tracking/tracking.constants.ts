export const TRACKING_PROVIDER_REPOSITORY = Symbol('TRACKING_PROVIDER_REPOSITORY');
export const TRACKING_EVENT_REPOSITORY = Symbol('TRACKING_EVENT_REPOSITORY');
export const TRACKING_EVENT_DISPATCHER = Symbol('TRACKING_EVENT_DISPATCHER');

/** Ventana de deduplicación (033 §4 "evitar eventos duplicados", §8 "deduplicación") — un mismo evento (mismo nombre+origen+payload) enviado dos veces dentro de esta ventana se descarta en el segundo intento. */
export const TRACKING_DEDUP_WINDOW_SECONDS = 10;
