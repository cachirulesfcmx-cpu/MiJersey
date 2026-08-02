# Site Configuration

Implementación de [`docs/prompts/030-Site-Configuration.md`](prompts/030-Site-Configuration.md). Módulo nuevo (`apps/api/src/modules/site-config`) que centraliza los parámetros operativos, regionales y de infraestructura del sitio (información general, dominio, idioma, moneda, zona horaria, políticas legales, integraciones globales) — explícitamente fuera de alcance la configuración visual del tema (029).

## Más simple que Theme a propósito: sin borrador/publicación ni versionado

A diferencia de Theme (029), la spec de Site Configuration (§3/§5/§7) no pide historial de versiones ni un paso de publicación separado — solo `GET`/`PATCH` autenticados. `SiteConfiguration` sigue siendo un singleton real (creado perezosamente con valores por defecto, mismo criterio que `ThemeSettings`/`CustomerProfile`), pero cada `PATCH` válido se persiste y refleja de inmediato, sin borrador intermedio. "Publicar cambios de forma controlada" (spec §4) se satisface con la validación previa a persistir (`validateSiteConfigurationInput`), no con un paso de publicación aparte — y "invalidación automática tras cambios" (spec §8) se satisface reseedeando la caché en el mismo `PATCH`, no con una `PublishUseCase` independiente.

## `SystemSetting`: par clave/valor por categoría, para lo que no amerita un campo propio

`SiteConfiguration` tiene "campos mínimos" cerrados (spec §3): nombre, dominio, idioma, moneda, timezone, locale, contacto de soporte. Todo lo demás que la spec menciona en el alcance (§2: "impuestos (configuración base)", "políticas legales", "integraciones globales") no tiene una forma fija ni un conjunto cerrado de claves — se modela como `SystemSetting` (`key` único, `value` JSON, `category` string libre). `category` no es un enum, mismo criterio que `NavigationMenu.location`: la spec no cierra el conjunto de categorías. No existe endpoint de borrado (no está en los "endpoints mínimos" de la spec, §7) — el Policy Manager y el Integration Settings del panel solo agregan/editan pares, nunca los eliminan del backend.

## Mutaciones bajo `system:configure`, no `catalog:manage`

Todos los módulos de contenido de este sprint (CMS Pages, Blog, Navigation, Theme) usan `catalog:manage` para mutaciones. Site Configuration usa `system:configure` en su lugar — el permiso que el seed (003) ya reserva exclusivamente para `SUPER_ADMIN` con la descripción "configurar ajustes globales de la plataforma", que coincide exactamente con este módulo. Es el criterio de "validación de configuraciones críticas" de la spec (§9): un `ADMIN` o `EDITOR` con `catalog:manage` puede **leer** la configuración (`admin:access` alcanza para los `GET`) pero no **escribirla** — verificado en vivo (ver más abajo).

## Validación de dominio: formato, no existencia

`validateSiteConfigurationInput` (dominio) valida formato con regex/`Intl` para cada campo presente en un `PATCH` parcial — mismo criterio minimalista que `validateThemeSectionConfig` (029): valida forma, no reglas de negocio profundas (no verifica que el dominio resuelva DNS, ni que el correo exista). Caso especial: `timezone` no puede validarse con una regex razonable, así que se usa `Intl.DateTimeFormat(undefined, { timeZone })` dentro de un `try/catch` — lanza `RangeError` para cualquier identificador IANA inválido. (`Intl.supportedValuesOf('timeZone')` hubiera sido más directo, pero requiere la lib `ES2022.Intl` de TypeScript, no disponible en el `target`/`lib` `ES2021` que usa `apps/api`; cambiarlo solo para este campo se consideró fuera de alcance.)

## Caché sin TTL, igual que Theme

`SiteConfigCacheService` sigue el mismo criterio que `ThemeCacheService` (029): `redis.client.set()` sin expiración, porque el único escritor de la clave (`site-config:active`) es `UpdateSiteConfigurationUseCase` — no hay drift externo del que protegerse. A diferencia de Theme (que reseedea la caché solo al publicar), aquí se reseedea en cada `PATCH` exitoso, porque no existe la distinción borrador/publicado.

## Endpoints

| Método | Ruta                     | Auth               | Descripción                                                         |
| ------ | ------------------------ | ------------------ | ------------------------------------------------------------------- |
| GET    | `/admin/settings/site`   | `admin:access`     | Configuración activa (creación perezosa en el primer acceso)        |
| PATCH  | `/admin/settings/site`   | `system:configure` | Actualiza campos de `SiteConfiguration`; valida y reseedea la caché |
| GET    | `/admin/settings/system` | `admin:access`     | Lista `SystemSetting`, filtrable por `?category=`                   |
| PATCH  | `/admin/settings/system` | `system:configure` | Upsert de una o más entradas clave/valor/categoría                  |

## Auditoría

`AuditLogRepositoryPort` registra: `site_config.updated` (con los campos tocados), `site_config.system_settings_updated` (con las claves tocadas).

## SDK

- `packages/sdk/src/site-config.types.ts`: `SiteConfiguration`, `SystemSetting`, `UpdateSiteConfigurationInput`, `UpdateSystemSettingsInput`.
- `api-client.ts`: `getSiteConfiguration`, `updateSiteConfiguration`, `listSystemSettings`, `updateSystemSettings`.

## Frontend

- **Admin**: `/site-configuration` — un único panel con: General Settings (nombre, correo/teléfono de soporte), Domain Manager / Language / Currency / Regional Settings (dominio, idioma, moneda, timezone, locale, todo en un mismo `PATCH /admin/settings/site`), Policy Manager e Integration Settings (dos editores clave/valor independientes sobre `SystemSetting`, filtrados por categoría `policies`/`integrations` respectivamente). Sin Live Preview ni historial de versiones — no aplica sin borrador/publicación separados.
- **Storefront**: sin cambios — la spec (§2 "APIs autenticadas") no incluye un endpoint público; los módulos que sí necesiten leer la configuración activa (022 Payments, 023 Shipping, 029 Theme, 031 Email Templates, 034 Notifications, por Definition of Done) podrán importar `SiteConfigModule` e inyectar `SiteConfigurationRepositoryPort`/`GetSiteConfigurationUseCase` directamente, sin exponer una ruta pública nueva.

## Verificación en vivo

Contra Railway (Postgres + Redis reales), con un administrador de prueba (`SUPER_ADMIN`, con `system:configure`) y un segundo usuario de prueba con rol `ADMIN` (sin `system:configure`):

**Por API (curl)**: `GET /admin/settings/site` en la primera visita crea el singleton con los valores por defecto; `PATCH` con un `defaultCurrency` en minúsculas devuelve `400 INVALID_SITE_CONFIGURATION`; un `timezone` inexistente devuelve el mismo error; un `PATCH` válido persiste y `GET` refleja el cambio de inmediato (caché reseedeada); `PATCH /admin/settings/system` crea entradas en `policies` e `integrations`, filtrables por `?category=`; una clave en blanco (solo espacios) pasa la validación del DTO pero es rechazada por la validación de dominio (`400 INVALID_SYSTEM_SETTING`); el usuario `ADMIN` de prueba puede hacer `GET` (200, tiene `admin:access`) pero no `PATCH` (403, sin `system:configure`) en ambos endpoints — confirmando en vivo la separación de permisos; sin token, `401`. El log de auditoría registra `site_config.updated` y `site_config.system_settings_updated` con los campos/claves tocados.

**Por navegador**: en `apps/admin`, `/site-configuration` carga los valores reales de `SiteConfiguration` y las entradas de `SystemSetting` creadas por API, permite editarlas y guardarlas por sección, y aparece resaltado en el sidebar bajo "Configuración del sitio".

La configuración general se restauró a sus valores por defecto en Railway al finalizar; las entradas de `SystemSetting` creadas durante la verificación (`policy.terms_url`, `integration.analytics_id`) se dejaron como datos de ejemplo, ya que el módulo no expone un endpoint de borrado (fuera de los "endpoints mínimos" de la spec).

## Alcance diferido

- **Validación de existencia de dominio/DNS** (spec §4 "validar dominios e idiomas permitidos") — se valida formato (regex de hostname), no resolución real; verificar que un dominio esté correctamente apuntado es una operación de infraestructura fuera del alcance de este módulo.
- **Borrado de `SystemSetting`** — no está en los endpoints mínimos de la spec (§7); el Policy Manager / Integration Settings del panel solo agregan y editan.
- **Integración activa con 022/023/029/031/034** (spec §13 Definition of Done) — el módulo expone su puerto de forma que esos módulos puedan consumir la configuración activa sin cambios estructurales, pero no se modificó ninguno de ellos para leerla todavía; 031 (Email Templates) y 034 (Notifications) ni siquiera existen aún en este sprint.
