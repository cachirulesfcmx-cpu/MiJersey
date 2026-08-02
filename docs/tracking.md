# Tracking & Pixels

Implementación de [`docs/prompts/033-Tracking-Pixels.md`](prompts/033-Tracking-Pixels.md). Módulo nuevo (`apps/api/src/modules/tracking`) que centraliza la configuración de proveedores de medición (Google Analytics 4, Google Tag Manager, Meta Pixel, TikTok Pixel, Conversion API), un despachador de eventos, el consentimiento de cookies del storefront y una consola de depuración — explícitamente fuera de alcance la automatización de campañas publicitarias.

## Modelo de dominio: dos entidades, mismo criterio "decoupled reference"

`TrackingProvider` (`provider` único, `status`, `configuration` Json, `consentCategory`) y `TrackingEvent` (bitácora de eventos despachados/probados) son las únicas tablas nuevas, literales del spec (§3). `TrackingEvent` no tiene FK a ninguna tabla — mismo criterio que `AnalyticsEvent` (032)/`AuditLogEntry`: `eventName`/`source`/`payload` son campos libres.

## `provider` único: un slot de configuración por canal, no por cuenta

"Permitir múltiples proveedores simultáneamente" (spec §4) se interpreta como varios _tipos_ de proveedor activos a la vez (GA4 + Meta Pixel + TikTok Pixel), no varias cuentas del mismo tipo — de ahí `provider` como `@unique`. Intentar crear una segunda configuración para un tipo ya existente devuelve `409 DUPLICATE_TRACKING_PROVIDER`.

## Solo `CONVERSION_API.accessToken` es secreto; el resto de IDs son públicos por diseño

GA4 (`measurementId`), GTM (`containerId`) y Meta/TikTok Pixel (`pixelId`) están pensados para viajar al navegador del visitante — así es como esos scripts funcionan realmente (se ven en el código fuente de cualquier sitio que los use). Conversion API es la excepción: corre server-side y su `accessToken` sí es un secreto. `validateTrackingConfiguration`/`toPublicConfiguration` (`tracking-configuration.util.ts`) codifican esta distinción por tipo de proveedor: la proyección pública (`GET /tracking/providers`) nunca incluye `accessToken`, y `CONVERSION_API` no expone ningún campo público porque nunca se ejecuta en el cliente.

## Superficie pública vs. superficie admin: al revés que la convención habitual

El resto de módulos del proyecto sigue el patrón "admin bajo `/admin/...`, lo público en la raíz, ambos autenticados salvo excepción". Aquí el spec (§7) lista literalmente `GET /tracking/providers` y `GET /tracking/consent` sin prefijo — y esos dos SÍ deben quedar sin autenticación, porque los consume cualquier visitante anónimo del storefront antes de que exista sesión alguna (Consent Banner, inyección de scripts). Se resolvió así:

- **Rutas literales del spec → superficie pública** (`PublicTrackingController`, `@Public()`): `GET /tracking/providers` (proyección segura, solo proveedores `ACTIVE`) y `GET /tracking/consent` (categorías de consentimiento en uso).
- **Gestión administrativa → extensión bajo `/admin/tracking/*`** (`AdminTrackingProvidersController`/`AdminTrackingEventsController`): `GET`/`POST`/`PATCH`/`DELETE` de proveedores (con secretos, para editar), `GET` del log de eventos, `POST /events/test`.

Un olvido real durante el desarrollo: el primer borrador de `PublicTrackingController` no llevaba `@Public()` y heredaba el guard JWT global — quedó expuesto con `401 Falta el encabezado de autorización` hasta que se verificó en vivo contra Railway. Corregido antes de cerrar el módulo (ver "Verificación en vivo").

## Validación de configuración: sintáctica y por tipo, no contra la API real del proveedor

`validateTrackingConfiguration` exige los campos mínimos no vacíos que cada tipo necesita (`measurementId`/`containerId`/`pixelId`/`pixelId`+`accessToken`) — no llama a Google/Meta/TikTok para verificar que el ID sea válido, porque el spec (§9 "validación de configuraciones") no define un contrato con esas APIs externas. En `PATCH`, la configuración enviada se mezcla (shallow merge) con la existente antes de validar, para permitir actualizar un solo campo (ej. rotar `accessToken`) sin reenviar todo.

## Despachador de eventos: adaptador de consola, mismo criterio que `ConsoleMailer`/`ManualPaymentProvider`

Sin credenciales reales de ningún proveedor en este entorno, `TrackingEventDispatcherPort` se implementa con `ConsoleTrackingDispatcher`, que registra el evento en el log (`delivered: false`) en vez de llamar a una API externa — mismo comportamiento de desarrollo que `ConsoleMailer` (003) y `ManualPaymentProvider` (022). Conectar un proveedor real es implementar este puerto contra su SDK/API (Measurement Protocol de GA4, Conversions API de Meta) sin tocar el resto del módulo.

## Deduplicación vía Redis `SET NX`, ventana corta

"Evitar eventos duplicados" (spec §4) y "deduplicación" (§8) se resolvieron con `TrackingDedupService`: hashea `eventName|source|payload` y hace `SET key value EX 10 NX` — si la clave ya existía, es un duplicado y `RecordTrackingEventUseCase` no crea la fila ni despacha. Ventana de 10s pensada para absorber reintentos/doble disparo del cliente, no como histórico de deduplicación.

## Consentimiento: política en el backend, elección del visitante en el navegador

El backend no persiste el consentimiento de cada visitante — sería una entidad nueva no pedida por el spec (§3 solo define `TrackingProvider`/`TrackingEvent`), y un Consent Banner real funciona así en la práctica: la elección se guarda del lado del cliente (aquí, `localStorage`, mismo patrón que el carrito de invitado y el historial de búsquedas de este storefront) y gatea qué scripts se inyectan. El backend solo expone la _política_: qué categorías existen (`GetConsentCategoriesUseCase`, derivadas de los `consentCategory` de los proveedores activos, con `necessary` siempre presente) y qué proveedores pertenecen a cada una.

`RecordTrackingEventUseCase` sí modela el lado servidor de "respetar el consentimiento" (§4): recibe `grantedConsentCategories` del llamador y solo despacha a los proveedores activos cuya categoría fue otorgada (o que no requieren ninguna, como Conversion API). El evento se registra siempre — el consentimiento gatea el _despacho_, no el registro para depuración.

## Auditoría

`AuditLogRepositoryPort` registra: `tracking.provider_created`, `.provider_updated`, `.provider_deleted`, `.event_tested`.

## Endpoints

| Método | Ruta                            | Auth               | Descripción                                                       |
| ------ | ------------------------------- | ------------------ | ----------------------------------------------------------------- |
| GET    | `/tracking/providers`           | Público            | Proveedores `ACTIVE` con configuración segura de exponer          |
| GET    | `/tracking/consent`             | Público            | Categorías de consentimiento en uso (siempre incluye `necessary`) |
| GET    | `/admin/tracking/providers`     | `admin:access`     | Lista completa (incluye secretos) para edición                    |
| POST   | `/admin/tracking/providers`     | `system:configure` | Crea un proveedor; valida configuración, rechaza duplicados       |
| PATCH  | `/admin/tracking/providers/:id` | `system:configure` | Actualiza (merge de configuración, valida el resultado)           |
| DELETE | `/admin/tracking/providers/:id` | `system:configure` | Elimina un proveedor                                              |
| GET    | `/admin/tracking/events`        | `admin:access`     | Bitácora paginada, filtrable por `eventName`/`source`/fecha       |
| POST   | `/admin/tracking/events/test`   | `system:configure` | Debug Console: despacha un evento a un proveedor específico       |

## Permisos: `system:configure`, no `catalog:manage`

Igual que Site Configuration (030): la configuración de proveedores incluye credenciales server-side (`CONVERSION_API.accessToken`), así que las mutaciones exigen `system:configure` (reservado a `SUPER_ADMIN`) en vez de `catalog:manage`. Lecturas admin bajo `admin:access`. Verificado en vivo: un usuario `SUPPORT` (solo `admin:access`) obtiene `200` en ambos `GET` admin pero `403` en `PATCH` de proveedor y en `POST /events/test`.

## SDK

- `packages/sdk/src/tracking.types.ts`: `TrackingProvider`/`PublicTrackingProvider`, `TrackingEvent`, inputs de creación/actualización, tipos de test/consent.
- `api-client.ts`: CRUD de providers, `listTrackingEvents`, `testTrackingEvent`, `getPublicTrackingProviders`, `getTrackingConsentCategories` (estos dos últimos sin `accessToken`, pensados para uso desde `apps/web`).

## Frontend

- **Admin**: `/tracking-providers` — Provider Manager: un formulario (crea o edita según `editingId`) con campos de configuración dinámicos según el tipo de proveedor seleccionado (en vez de un textarea JSON genérico, porque el conjunto de campos por tipo es pequeño y cerrado), tabla con editar/eliminar. `/tracking-events` — bitácora paginada + Debug Console (enviar evento de prueba a un proveedor, ver el resultado y la fila nueva de inmediato).
- **Storefront** (`apps/web`): `ConsentBanner` (montado en el layout raíz) — consulta `/tracking/consent` y `/tracking/providers` sin autenticación; si no hay elección guardada en `localStorage`, muestra el banner ("Aceptar todo" / "Solo necesarias"); al elegir, persiste la elección y (en "Aceptar todo") recarga para inyectar los scripts de los proveedores activos cuya categoría fue otorgada, vía `inject-provider-scripts.ts` (snippets estándar de cada proveedor — Measurement Protocol de GA4, GTM, Meta Pixel, TikTok Pixel — sin variaciones propias; Conversion API no inyecta nada porque no corre en el navegador).

## Verificación en vivo

Contra Railway (Postgres + Redis reales), con el administrador de prueba (`SUPER_ADMIN`) y un segundo usuario `SUPPORT` (solo `admin:access`, reutilizado de la verificación de 032).

**Bug encontrado y corregido durante la verificación**: `GET /tracking/providers` y `GET /tracking/consent` devolvían `401 Falta el encabezado de autorización` a pesar de no llevar ningún guard de permisos explícito — el guard JWT global de la aplicación exige `@Public()` para eximir una ruta (patrón usado por `PublicThemeController` y otros controllers públicos del proyecto), decorador que faltaba en `PublicTrackingController`. Corregido agregando `@Public()`; confirmado en caliente (hot-reload) que ambos endpoints responden sin token tras el fix.

**Por API (curl)**: crear un proveedor GA4 sin `measurementId` devuelve `400 INVALID_TRACKING_CONFIGURATION`; con `measurementId` válido se crea correctamente; una segunda configuración del mismo tipo devuelve `409 DUPLICATE_TRACKING_PROVIDER`; `GET /tracking/providers` público refleja el proveedor activo con solo `measurementId` (sin secretos); `GET /tracking/consent` pasa de `["necessary"]` a `["necessary","analytics"]` al activar un proveedor con esa categoría; `POST /admin/tracking/events/test` despacha (log del `ConsoleTrackingDispatcher`, `delivered:false` al no haber credenciales reales) y crea la fila con `source: "admin-test"`; el log de auditoría registra `tracking.provider_created`; el usuario `SUPPORT` obtiene `200` en los `GET` admin pero `403` en `PATCH`/`POST test`; eliminar el proveedor lo remueve también de la proyección pública y de las categorías de consentimiento.

**Por navegador**: en `apps/admin`, `/tracking-providers` cambia dinámicamente los campos del formulario al seleccionar "Meta Pixel" (de `measurementId` a `Pixel ID`), crea el proveedor y lo muestra en la tabla; `/tracking-events` con la Debug Console envía un evento de prueba y la fila nueva aparece de inmediato en la bitácora. En `apps/web`, la página de inicio muestra el Consent Banner en la primera visita; al pulsar "Aceptar todo" se persiste `{"necessary":true,"marketing":true}` en `localStorage`, se inyecta el script de Meta Pixel (confirmado por el atributo `data-mijersey-tracking-provider` en el DOM) y, tras recargar, el banner ya no vuelve a aparecer.

Los proveedores y eventos de prueba creados durante la verificación se eliminaron al finalizar.

## Alcance diferido

- **Integración activa de productores de eventos** (spec §13 DoD: 013 Home, 018 Checkout, 022 Payments, 032 Analytics, 034 Notifications) — `RecordTrackingEventUseCase` está listo para ser invocado en proceso por esos módulos (con deduplicación y verificación de consentimiento ya resueltas), pero ninguno fue modificado todavía para llamarlo.
- **Conversion API real** — el adaptador es un puerto (`TrackingEventDispatcherPort`) con una implementación de consola; conectar Meta/TikTok Conversions API de verdad requiere credenciales reales y no se implementó una llamada HTTP saliente a esos servicios en este entorno.
- **Persistencia de consentimiento por visitante en el backend** — la elección vive solo en `localStorage` del navegador; no hay sincronización entre dispositivos ni analítica agregada de tasas de consentimiento, porque el spec no pide un modelo de dominio para ello (§3 solo define `TrackingProvider`/`TrackingEvent`).
- **Event Mapper visual** (spec §6) — el mapeo de eventos de negocio a nombres de plataforma se resuelve por convención en el código de cada futuro productor (`RecordTrackingEventUseCase` recibe `eventName` ya resuelto), no hay una UI de mapeo configurable.
