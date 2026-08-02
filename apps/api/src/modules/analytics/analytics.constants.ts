export const ANALYTICS_EVENT_REPOSITORY = Symbol('ANALYTICS_EVENT_REPOSITORY');
export const ANALYTICS_DASHBOARD_REPOSITORY = Symbol('ANALYTICS_DASHBOARD_REPOSITORY');
export const ANALYTICS_QUERY_REPOSITORY = Symbol('ANALYTICS_QUERY_REPOSITORY');

/** TTL de la caché de reportes (spec §8 "caché de consultas") — a diferencia de Theme/SiteConfig/EmailTemplates (sin TTL, un único escritor explícito), los reportes de Analytics resumen datos que cambian continuamente con cada pedido real; con expiración por tiempo, mismo criterio que `TaxonomyCacheService`/`CmsCacheService` (006/026). */
export const ANALYTICS_CACHE_TTL_SECONDS = 300;

export function analyticsCacheKey(report: string, params: Record<string, string | number>): string {
  const suffix = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return `analytics:${report}:${suffix}`;
}
