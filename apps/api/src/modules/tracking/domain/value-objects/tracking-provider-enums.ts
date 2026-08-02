export const TRACKING_PROVIDER_TYPES = [
  'GOOGLE_ANALYTICS_4',
  'GOOGLE_TAG_MANAGER',
  'META_PIXEL',
  'TIKTOK_PIXEL',
  'CONVERSION_API',
] as const;
export type TrackingProviderType = (typeof TRACKING_PROVIDER_TYPES)[number];

export const TRACKING_PROVIDER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type TrackingProviderStatus = (typeof TRACKING_PROVIDER_STATUSES)[number];

/** Categorías de consentimiento del Consent Banner (033 §6/§9) — `necessary` siempre está permitida (no se le pide consentimiento al visitante); un proveedor sin `consentCategory` (null) tampoco requiere consentimiento, ej. Conversion API server-side, que nunca corre en el navegador del visitante. */
export const CONSENT_CATEGORIES = ['necessary', 'analytics', 'marketing'] as const;
export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];
