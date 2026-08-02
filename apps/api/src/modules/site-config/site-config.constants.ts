export const SITE_CONFIGURATION_REPOSITORY = Symbol('SITE_CONFIGURATION_REPOSITORY');
export const SYSTEM_SETTING_REPOSITORY = Symbol('SYSTEM_SETTING_REPOSITORY');

/** Clave de caché de la configuración activa — sin TTL, igual que `PUBLIC_THEME_CACHE_KEY` (029): el único escritor es `UpdateSiteConfigurationUseCase`, así que no hay drift externo del que protegerse (spec §8 "invalidación automática tras cambios", no por vencimiento). */
export const SITE_CONFIGURATION_CACHE_KEY = 'site-config:active';

/** Valores por defecto usados al crear el singleton perezosamente (mismo criterio que `DEFAULT_THEME_SETTINGS`, 029). */
export const DEFAULT_SITE_CONFIGURATION = {
  siteName: 'MiJersey',
  defaultDomain: 'mijersey.com',
  defaultLanguage: 'es',
  defaultCurrency: 'MXN',
  timezone: 'America/Mexico_City',
  locale: 'es-MX',
  supportEmail: 'soporte@mijersey.com',
  supportPhone: null,
} as const;
