import type { TrackingProviderType } from './tracking-provider-enums';

type Configuration = Record<string, unknown>;

/** Campos requeridos y campos seguros de exponer públicamente por tipo de proveedor (033 §9 "protección de credenciales"). Los IDs de medición/píxel son seguros de exponer: así funcionan estos scripts en el navegador. Solo `CONVERSION_API.accessToken` es un secreto server-side — por eso ese proveedor no tiene campos públicos: nunca corre en el cliente. */
const PROVIDER_FIELDS: Record<TrackingProviderType, { required: string[]; public: string[] }> = {
  GOOGLE_ANALYTICS_4: { required: ['measurementId'], public: ['measurementId'] },
  GOOGLE_TAG_MANAGER: { required: ['containerId'], public: ['containerId'] },
  META_PIXEL: { required: ['pixelId'], public: ['pixelId'] },
  TIKTOK_PIXEL: { required: ['pixelId'], public: ['pixelId'] },
  CONVERSION_API: { required: ['pixelId', 'accessToken'], public: [] },
};

/** Valida que `configuration` traiga los campos mínimos de forma (string no vacío) que cada tipo de proveedor necesita para funcionar — no valida contra la API real de Google/Meta/TikTok (spec §9 "validación de configuraciones", sin definir un esquema de negocio cerrado). */
export function validateTrackingConfiguration(
  provider: TrackingProviderType,
  configuration: Configuration,
): string[] {
  const { required } = PROVIDER_FIELDS[provider];
  const missing: string[] = [];

  for (const field of required) {
    const value = configuration[field];
    if (typeof value !== 'string' || value.trim().length === 0) {
      missing.push(field);
    }
  }

  return missing;
}

/** Proyección pública de la configuración (033 §9) — usada por `GET /tracking/providers` (sin autenticación, consumido por el storefront) para inyectar scripts de proveedores activos sin filtrar secretos. */
export function toPublicConfiguration(
  provider: TrackingProviderType,
  configuration: Configuration,
): Configuration {
  const { public: publicFields } = PROVIDER_FIELDS[provider];
  const result: Configuration = {};
  for (const field of publicFields) {
    if (field in configuration) result[field] = configuration[field];
  }
  return result;
}
