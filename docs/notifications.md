# Notifications

Implementación de [`docs/prompts/034-Notifications.md`](prompts/034-Notifications.md). Módulo nuevo (`apps/api/src/modules/notifications`) que centraliza el envío de comunicaciones transaccionales (correo, SMS, WhatsApp, push), con preferencias por cliente, reintentos acotados y trazabilidad completa del ciclo de vida de cada notificación. Es el noveno y último módulo de la tanda `026-034` iniciada con "Continua:".

## Modelo de dominio: dos entidades, extendidas sobre los campos mínimos del spec

`Notification` (`channel`/`templateKey`/`recipient`/`status`/`payload`/`queuedAt`/`sentAt`/`deliveredAt`/`failedAt`/`createdAt` son literales del spec §3) se extiende con `customerId` (nullable — una notificación de prueba admin no tiene cliente asociado), `idempotencyKey` (único, nullable), `retryCount` y `lastError`. `NotificationPreference` es literal del spec (`customerId`+`channel`+`enabled`+`updatedAt`), con `@@unique([customerId, channel])`.

## Endpoints self-service bajo `/notifications`, no `/me/notifications`

El spec (§7) lista las rutas literales `GET /notifications`, `GET/PATCH /notifications/preferences` sin prefijo — se implementaron tal cual en `MyNotificationsController`, protegidas solo por el guard JWT global (sin `PermissionsGuard`) y con el `customerId` tomado de `CurrentUser().sub`, el mismo patrón `/me/*` que ya usa Customer Account (019, `MyAccountController`). Cualquier usuario autenticado (cliente o staff) ve únicamente sus propias notificaciones y preferencias — no hay forma de leer las de otro `customerId` por esta vía.

## Retry bajo `/admin/notifications/:id/retry`, no `/notifications/retry/:id`

El spec (§7) sitúa `POST /notifications/retry/:id` junto a los endpoints self-service, pero reintentar una notificación fallida es una acción operativa de soporte/administración (el spec mismo lo confirma en §6, listando "Retry Manager" como componente del Admin Dashboard), no algo que un cliente deba disparar sobre su propia notificación. Se movió, junto con `POST /notifications/test`, bajo la extensión admin `/admin/notifications/*` (mismo criterio de "rutas literales públicas o self-service se respetan tal cual; lo administrativo se extiende bajo `/admin/`" usado en el resto del proyecto — a diferencia de Tracking (033), que invirtió el patrón porque ahí las rutas literales eran para visitantes anónimos, no autenticados).

## Integración real con Email Templates (031), no un stub más

El spec (§5 y §13 DoD) exige explícitamente integración con Email Templates. A diferencia de SMS/WhatsApp/Push — canales sin ninguna infraestructura previa en este proyecto —, `EmailNotificationChannel` reutiliza el motor de plantillas real: resuelve la plantilla `PUBLISHED` por `templateKey` + idioma (`es`), compone el HTML con `composeEmailHtml`/`renderTemplate` (mismas utilidades de dominio de 031) y envía a través de `EmailTransportPort` (el mismo `NodemailerEmailTransport` que cae a "SMTP no configurado: log a consola" en desarrollo, comportamiento ya verificado en 031). Requirió agregar un `exports: [EMAIL_TEMPLATE_REPOSITORY, EMAIL_LAYOUT_REPOSITORY, EMAIL_TRANSPORT]` a `EmailTemplatesModule`, que antes no exportaba nada porque ningún otro módulo lo necesitaba.

Se exige `status === 'PUBLISHED'` (no el borrador más reciente): una notificación real a un destinatario real nunca debe usar contenido en edición, a diferencia del flujo de _test send_ de 031 que sí previsualiza borradores por diseño.

SMS/WhatsApp/Push usan `ConsoleNotificationChannel`, un stub parametrizado por nombre de canal que registra en log y devuelve `delivered: false` — mismo criterio que `ConsoleMailer` (003) y `ConsoleTrackingDispatcher` (033): no hay credenciales de Twilio/proveedor push en este entorno.

## Preferencias: si el canal está desactivado, la notificación no se crea

`GetNotificationPreferencesUseCase` sintetiza los 4 canales completos (`EMAIL`/`SMS`/`WHATSAPP`/`PUSH`) para cualquier cliente aunque no tenga filas explícitas en `NotificationPreference` — el valor por defecto es `enabled: true`, y solo se materializa una fila cuando el cliente cambia algo. `SendNotificationUseCase` (usada por futuros productores de eventos, ver "Alcance diferido") consulta la preferencia antes de despachar: si el cliente desactivó el canal, no se crea ninguna fila de `Notification` — mismo criterio de "el consentimiento/preferencia gatea el efecto, no queda un registro fantasma" que Tracking (033) aplica al consentimiento de cookies.

Este skip solo aplica al flujo con `customerId` conocido; `POST /admin/notifications/test` es una herramienta de depuración administrativa que envía sin consultar preferencias (no tiene cliente real detrás, típicamente).

## Idempotencia vía `idempotencyKey` único

"Evitar envíos duplicados mediante idempotencia" (spec §4) se resuelve con la columna `idempotencyKey` (`@unique`, nullable): si `SendNotificationUseCase` recibe una clave que ya existe, devuelve la notificación existente en vez de crear una nueva. Sin esta clave (caso de `test`), no hay deduplicación — es intencional, una consola de prueba debe poder reenviar el mismo payload cuantas veces se quiera.

## Reintentos: acotados y disparados por un humano, no por una cola

El spec (§4, §8) pide "reintentos automáticos" y "colas distribuidas", pero no existe ningún broker de mensajes ni scheduler en este stack (ninguno de los 33 módulos anteriores lo introdujo). Se re-alcanzó como reintento **manual, acotado a `MAX_NOTIFICATION_RETRIES = 3`**, disparado por `POST /admin/notifications/:id/retry` — consistente con que el spec mismo (§6) ubica "Retry Manager" como un componente de UI administrativa, es decir, algo que un humano acciona, no un job en segundo plano. Al superar el máximo, el endpoint devuelve `409 MAX_RETRIES_EXCEEDED` (verificado en vivo: 3 reintentos exitosos sobre una notificación `FAILED`, el cuarto intento rechazado).

## Auditoría selectiva, igual criterio que Analytics y Tracking

`AuditLogRepositoryPort` registra únicamente `notification.tested`, `notification.retried` y `notification.preferences_updated` — los envíos rutinarios (vía `SendNotificationUseCase`, cuando exista un productor real) no se auditan por separado porque el propio ciclo de vida de la fila `Notification` (`status`/`sentAt`/`deliveredAt`/`failedAt`/`lastError`) ya es la trazabilidad exigida por el spec §10 ("registrar envíos, entregas, errores"); auditar además cada envío sería duplicar el mismo dato en dos tablas.

## Permisos: lectura admin en `admin:access`, mutación en `catalog:manage`

A diferencia de Tracking (033), que exige `system:configure` porque sus proveedores guardan credenciales server-side, Notifications no tiene una entidad de configuración con secretos — el canal de correo reutiliza credenciales SMTP ya gestionadas por Email Templates/Site Configuration. Por eso `test`/`retry` piden `catalog:manage` (el nivel general de mutación administrativa de este proyecto), no `system:configure`. Verificado en vivo: un usuario `SUPPORT` (solo `admin:access`) obtiene `200` en `GET /admin/notifications` pero `403` en `POST /admin/notifications/test` y `POST /admin/notifications/:id/retry`.

## Endpoints

| Método | Ruta                             | Auth             | Descripción                                                        |
| ------ | -------------------------------- | ---------------- | ------------------------------------------------------------------ |
| GET    | `/notifications`                 | Sesión (self)    | Notificaciones del cliente autenticado, paginado                   |
| GET    | `/notifications/preferences`     | Sesión (self)    | Preferencias de los 4 canales (sintetizadas si no hay filas)       |
| PATCH  | `/notifications/preferences`     | Sesión (self)    | Actualiza una o más preferencias del cliente autenticado           |
| GET    | `/admin/notifications`           | `admin:access`   | Bitácora completa (todos los clientes), filtrable por canal/estado |
| POST   | `/admin/notifications/test`      | `catalog:manage` | Envía una notificación de prueba a cualquier destinatario          |
| POST   | `/admin/notifications/:id/retry` | `catalog:manage` | Reintenta una notificación `FAILED` (máx. 3 veces)                 |

## SDK

- `packages/sdk/src/notifications.types.ts`: `Notification`, `NotificationPreference`, `NotificationChannel`/`NotificationStatus`, inputs de test/retry/preferencias, params de listado (self y admin).
- `api-client.ts`: `listMyNotifications`, `getMyNotificationPreferences`, `updateMyNotificationPreferences`, `listNotifications` (admin), `testNotification`, `retryNotification`.

## Frontend

- **Admin** (`/notifications`): Admin Dashboard + Delivery Status + Retry Manager combinados en una sola vista — tabla filtrable por estado/canal con botón "Reintentar" condicional a `status === 'FAILED'`, y un panel de Test Send (canal, clave de plantilla, destinatario, payload JSON) equivalente en espíritu a la Debug Console de Tracking (033).
- **Storefront** (`apps/web`): sección "Notificaciones" en `/account` (Preferences Manager) — cuatro toggles, uno por canal, que llaman a `PATCH /notifications/preferences` y reflejan el estado guardado de inmediato. No se implementó un Notification Center/Timeline de cliente separado: el spec (§6) los lista como componentes deseables, pero sin notificaciones reales de clientes en la base de datos de este entorno (ningún productor de eventos las genera todavía, ver "Alcance diferido"), la superficie de valor inmediato para el cliente es la de preferencias.

## Verificación en vivo

Contra Railway (Postgres real), con el administrador de prueba (`SUPER_ADMIN`), un usuario `SUPPORT` (solo `admin:access`, reutilizado de verificaciones previas) y un cliente nuevo registrado para esta verificación.

**Envío real de EMAIL de extremo a extremo**: usando la plantilla `order.confirmation` (`PUBLISHED`, creada durante la verificación de 031), `POST /admin/notifications/test` con `{"channel":"EMAIL","templateKey":"order.confirmation","recipient":"...","payload":{"name":"...","orderId":"ORD-9001"}}` devolvió `status: "DELIVERED"` con `sentAt`/`deliveredAt` poblados; el log del servidor confirma `[SMTP no configurado] Correo para ... — asunto: "Tu pedido ORD-9001 fue confirmado"` desde `NodemailerEmailTransport`, mismo comportamiento de _fallback_ de desarrollo ya verificado en 031 — el pipeline de plantilla → composición → transporte funcionó completo.

**Fallo limpio y reintentos**: una prueba con `templateKey` inexistente devolvió `status: "FAILED"` con `lastError: "No hay una plantilla publicada para la clave \"template.que.no.existe\" (es)"`. Tres llamadas sucesivas a `POST /admin/notifications/:id/retry` incrementaron `retryCount` (1, 2, 3) manteniendo el mismo error; la cuarta devolvió `409 MAX_RETRIES_EXCEEDED` — el tope se respeta.

**Preferencias**: `GET /notifications/preferences` devuelve los 4 canales en `true` por defecto sin filas previas; `PATCH` con `{"updates":[{"channel":"EMAIL","enabled":false}]}` persiste y refleja el cambio de inmediato.

**Permisos**: usuario `SUPPORT` — `200` en `GET /admin/notifications`, `403 FORBIDDEN` en `POST /admin/notifications/test` y en `POST /admin/notifications/:id/retry`.

**Por navegador**: en `apps/admin`, `/notifications` muestra la bitácora con las dos notificaciones de prueba (una `Entregada`, una `Fallida` con su botón "Reintentar" y el mensaje de error visible en la columna correspondiente) y el panel de envío de prueba funcional. En `apps/web`, un cliente nuevo inicia sesión, entra a `/account`, ve la sección "Notificaciones" con los 4 canales en "Activado", desactiva "Correo electrónico" con un clic y el cambio se persiste (`PATCH` 200) y se refleja como "Desactivado" sin recargar la página.

Los datos de prueba (notificaciones, cliente) creados durante la verificación quedaron en la base de Railway, igual que en verificaciones previas de este proyecto (no existe endpoint de borrado para `Notification`, coherente con que es un registro de auditoría, no una entidad editable).

## Alcance diferido

- **Productores de eventos reales** (spec §13 DoD: 021 Orders, 022 Payments, 023 Shipping, 025 Customer Service) — `SendNotificationUseCase` está listo para ser invocado en proceso por esos módulos (con respeto de preferencias e idempotencia ya resueltos, exportado desde `NotificationsModule`), pero ninguno fue modificado todavía para llamarlo; hoy la única vía de creación de notificaciones es `POST /admin/notifications/test`.
- **Integración con Analytics y Tracking** (spec §13 DoD: 032, 033) — no se registran eventos de analítica ni de tracking por cada notificación enviada; se consideró fuera del alcance mínimo sin productores de eventos reales que disparen el flujo completo.
- **Colas distribuidas / procesamiento asíncrono real** (spec §8) — el envío es síncrono dentro del request; no hay un worker ni un broker de mensajes en este stack.
- **Notification Center / Timeline de cliente** (spec §6) — no implementado en el storefront por falta de notificaciones reales de clientes que mostrar (ver primer punto); la superficie de preferencias sí se implementó por ser accionable de inmediato.
- **Cifrado de datos sensibles en `payload`** (spec §9) — el `payload` Json se persiste en claro, igual que el resto de columnas Json de este proyecto (`AnalyticsEvent.payload`, `TrackingEvent.payload`); no se introdujo cifrado a nivel de columna sin un requisito concreto de qué campos calificarían como sensibles.
