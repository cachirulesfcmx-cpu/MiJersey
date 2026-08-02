export const EMAIL_TEMPLATE_REPOSITORY = Symbol('EMAIL_TEMPLATE_REPOSITORY');
export const EMAIL_TEMPLATE_VERSION_REPOSITORY = Symbol('EMAIL_TEMPLATE_VERSION_REPOSITORY');
export const EMAIL_LAYOUT_REPOSITORY = Symbol('EMAIL_LAYOUT_REPOSITORY');
export const EMAIL_TRANSPORT = Symbol('EMAIL_TRANSPORT');

/** Prefijo de la caché de plantillas publicadas (spec §8) — sin TTL, mismo criterio que `PUBLIC_THEME_CACHE_KEY` (029): el único escritor de cada clave es `PublishEmailTemplateUseCase`. Clave completa: `email-template:published:{key}:{language}`. */
export function publishedTemplateCacheKey(key: string, language: string): string {
  return `email-template:published:${key}:${language}`;
}
