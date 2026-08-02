export const THEME_REPOSITORY = Symbol('THEME_REPOSITORY');
export const THEME_VERSION_REPOSITORY = Symbol('THEME_VERSION_REPOSITORY');

/** Clave de la caché pública del tema publicado. Sin TTL a propósito (a diferencia de CMS Pages/Blog/Navigation, con TTL de 60 s): el único escritor de esta clave es `PublishThemeUseCase`, así que no hay contenido externo que pueda volverse obsoleto entre publicaciones — invalidación explícita, no por vencimiento (spec §8 "invalidación selectiva"). */
export const PUBLIC_THEME_CACHE_KEY = 'theme:public:published';

/** Valores por defecto usados al crear el singleton perezosamente (spec §12 "el storefront refleje la configuración activa" — nunca debe quedar sin un tema válido). */
export const DEFAULT_THEME_SETTINGS = {
  siteName: 'MiJersey',
  logo: null,
  favicon: null,
  primaryColor: '#111827',
  secondaryColor: '#6B7280',
  typography: 'Inter, sans-serif',
  borderRadius: '8px',
  spacingScale: '1rem',
} as const;
