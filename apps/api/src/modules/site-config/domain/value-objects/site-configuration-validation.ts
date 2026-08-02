const DOMAIN_PATTERN = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;
const LANGUAGE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const LOCALE_PATTERN = /^[a-z]{2}-[A-Z]{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** `Intl.supportedValuesOf` requiere lib `ES2022.Intl` (no disponible en el `target`/`lib` `ES2021` de este proyecto) — se valida el timezone intentando formatearlo, ya que `Intl.DateTimeFormat` lanza `RangeError` para cualquier identificador IANA inválido. */
function isValidTimeZone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export interface SiteConfigurationInput {
  siteName?: string;
  defaultDomain?: string;
  defaultLanguage?: string;
  defaultCurrency?: string;
  timezone?: string;
  locale?: string;
  supportEmail?: string;
  supportPhone?: string | null;
}

/** Validación mínima de forma (spec §4 "validar dominios e idiomas permitidos", §9 "validación de configuraciones críticas") — mismo criterio de "campos mínimos, no un esquema completo" que `validateThemeSectionConfig` (029). Cada campo se valida solo si viene presente, ya que `PATCH` admite actualizaciones parciales. */
export function validateSiteConfigurationInput(input: SiteConfigurationInput): string | null {
  if (input.siteName !== undefined && input.siteName.trim().length === 0) {
    return 'siteName no puede estar vacío';
  }

  if (input.defaultDomain !== undefined && !DOMAIN_PATTERN.test(input.defaultDomain)) {
    return 'defaultDomain debe ser un dominio válido (ej. mijersey.com)';
  }

  if (input.defaultLanguage !== undefined && !LANGUAGE_PATTERN.test(input.defaultLanguage)) {
    return 'defaultLanguage debe seguir el formato ISO 639-1 (ej. es, es-MX)';
  }

  if (input.defaultCurrency !== undefined && !CURRENCY_PATTERN.test(input.defaultCurrency)) {
    return 'defaultCurrency debe ser un código ISO 4217 de 3 letras mayúsculas (ej. MXN)';
  }

  if (input.timezone !== undefined && !isValidTimeZone(input.timezone)) {
    return 'timezone debe ser un identificador IANA válido (ej. America/Mexico_City)';
  }

  if (input.locale !== undefined && !LOCALE_PATTERN.test(input.locale)) {
    return 'locale debe seguir el formato BCP 47 (ej. es-MX)';
  }

  if (input.supportEmail !== undefined && !EMAIL_PATTERN.test(input.supportEmail)) {
    return 'supportEmail debe ser un correo válido';
  }

  return null;
}
