export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');
export const NOTIFICATION_PREFERENCE_REPOSITORY = Symbol('NOTIFICATION_PREFERENCE_REPOSITORY');
export const NOTIFICATION_CHANNEL_REGISTRY = Symbol('NOTIFICATION_CHANNEL_REGISTRY');

/// Tope de reintentos manuales (034 §4 "políticas configurables") — sin un worker/cron en este stack, el "reintento automático" se expresa como un límite que el Retry Manager (admin) no puede exceder, no como un job programado.
export const MAX_NOTIFICATION_RETRIES = 3;
