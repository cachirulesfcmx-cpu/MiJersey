# Email Templates

Implementación de [`docs/prompts/031-Email-Templates.md`](prompts/031-Email-Templates.md). Módulo nuevo (`apps/api/src/modules/email-templates`) que centraliza la generación de correos transaccionales mediante plantillas reutilizables, versionadas e internacionalizadas, con layouts compartidos, un motor de interpolación de variables propio y pruebas de envío — explícitamente fuera de alcance las campañas de marketing masivo.

## `version` en la entidad, no solo en su historial

A diferencia de Page/Post/NavigationMenu (que versionan únicamente en una tabla aparte), la spec (§3) pide `version` como campo directo de `EmailTemplate`. Se resolvió incrementándolo en cada `PATCH` (`PrismaEmailTemplateRepository.update` hace `version: { increment: 1 }`), mientras que el historial completo sigue viviendo en `EmailTemplateVersion` (snapshot completo por versión, mismo criterio que `PageVersion`/`PostVersion`/`NavigationVersion`/`ThemeVersion`). Se crea una versión tanto en cada `PATCH` como en cada publicación (mismo criterio que `ThemeVersion`), para distinguir "guardé un borrador" de "esto fue lo que se publicó".

## `key` único por idioma, no un `key` global

"Cada plantilla tendrá una clave única" (spec §4) se combina con "soportar múltiples idiomas" (mismo §4): la clave por sí sola no puede ser única si `order.confirmation` necesita una fila en español y otra en inglés. La restricción real es `@@unique([key, language])` — la clave identifica el _tipo_ de correo, y una misma clave puede tener una variante por idioma.

## Motor de interpolación propio, sin dependencia de templating

No había ninguna librería de templating en el proyecto (ni Handlebars, ni Mustache) y la spec (§2 "variables dinámicas") solo pide sustitución simple `{{variable}}` — se implementó una regex minimalista (`template-renderer.util.ts`) en vez de añadir una dependencia nueva, mismo criterio de "campos mínimos, no un motor completo" aplicado en el resto del proyecto. `renderTemplate` sustituye cada `{{variable}}`, reporta las variables sin valor provisto (`missingVariables`) en vez de fallar, y escapa HTML por defecto — desactivable (`escape: false`) para componer HTML ya resuelto dentro de un layout.

## Sanitización: se escapan los _valores_ de las variables, no el HTML de la plantilla

El HTML de la plantilla es autoría de staff (confiable, mismo nivel de confianza que el contenido de `PageBlock`/`Post.html`, que tampoco se sanitizan en este proyecto). El riesgo real de "sanitización del HTML" (spec §9) está en los _valores_ que se interpolan en tiempo de envío — pueden venir de datos de dominio con caracteres controlados por el usuario final (ej. el nombre de un cliente). `escapeHtml` se aplica a cada valor de variable al interpolarlo en `html` (no en `subject`/`text`, que no son contextos HTML) — verificado en vivo: un valor `<Ana>` llega escapado (`&lt;Ana&gt;`) al HTML pero intacto al texto plano.

## Layouts: composición vía el mismo motor de interpolación, no un mecanismo aparte

Un `EmailLayout.html` es una plantilla más, con un placeholder `{{content}}` (validado al crear/actualizar: `CreateEmailLayoutUseCase`/`UpdateEmailLayoutUseCase` rechazan un `html` que no lo incluya) y opcionalmente `{{css}}`. `composeEmailHtml` reutiliza `renderTemplate` dos veces: primero interpola las variables de negocio en el HTML de la plantilla (escapadas), luego inserta ese resultado ya renderizado en el layout **sin volver a escapar** (es HTML de confianza, no un valor de variable). Sin versionado propio para `EmailLayout` — la spec no lo pide para ese modelo (§3).

## Validación antes de publicar: sintáctica, no contra un catálogo de negocio

"Validar variables antes de publicar" (spec §4) se interpreta como validación de forma: `validateEmailTemplateForPublish` detecta llaves de variable sin cerrar (`{{` sin `}}` correspondiente) en `subject`/`html`/`text` antes de permitir la publicación — no valida que las variables referenciadas pertenezcan a un esquema de negocio cerrado por `key`, porque la spec no define uno. Mismo criterio minimalista que `validateThemeSectionConfig` (029).

## Transporte de correo real, con el mismo fallback de desarrollo que `ConsoleMailer`

El adaptador de correo de Identity (`ConsoleMailer`, 003) documentaba explícitamente que "un proveedor real llega con el módulo 031-Email-Templates" y que su `MailerPort` no debía cambiar. Se cumplió literalmente: `MailerPort` (identity) sigue intacto, con sus dos métodos de enlaces simples (verificación de correo, recuperación de contraseña). Email Templates trae su **propio** puerto (`EmailTransportPort`) para el caso de uso distinto de correos por plantilla — implementado con `nodemailer` (`NodemailerEmailTransport`), configurado vía variables SMTP opcionales (`SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD`/`SMTP_FROM`). Sin `SMTP_HOST` configurado (como en este entorno de verificación), registra el correo en el log en vez de enviarlo — mismo comportamiento de desarrollo que `ConsoleMailer`, verificado en vivo.

## Caché de plantillas publicadas, sin TTL

`EmailTemplateCacheService` sigue el mismo criterio que `ThemeCacheService` (029) y `SiteConfigCacheService` (030): sin expiración, porque el único escritor de cada clave (`email-template:published:{key}:{language}`) es `PublishEmailTemplateUseCase`. Al publicar, se cachea la plantilla **junto con su layout resuelto** (`{ template, layout }`) para que un futuro consumidor (Notifications, 034) resuelva ambos en una sola lectura.

## Test Send: prueba el borrador, no la versión publicada

El objetivo de "Test Send" es previsualizar cambios antes de publicarlos, así que `TestSendEmailTemplateUseCase` renderiza el contenido **actual** de la plantilla (por `id`, sin importar su `status`) — no pasa por la caché de publicadas. Las variables sin valor no bloquean el envío (mejor esfuerzo) pero se reportan en la respuesta para que el editor las muestre.

## Permisos: `catalog:manage`, no `system:configure`

A diferencia de Site Configuration (030, "configuración crítica del sistema"), Email Templates es un módulo de contenido administrado por staff editorial — mismo criterio que CMS Pages/Blog/Navigation/Theme: mutaciones bajo `catalog:manage`, lecturas bajo `admin:access`. Verificado en vivo: un usuario `SUPPORT` (solo `admin:access`) puede leer plantillas pero no editarlas (`403`).

## Endpoints

| Método | Ruta                                                         | Auth             | Descripción                                                                             |
| ------ | ------------------------------------------------------------ | ---------------- | --------------------------------------------------------------------------------------- |
| GET    | `/admin/email/templates`                                     | `admin:access`   | Listado paginado, filtrable por `key`/`language`/`status`                               |
| POST   | `/admin/email/templates`                                     | `catalog:manage` | Crea una plantilla (nace en `DRAFT`) y su versión #1                                    |
| GET    | `/admin/email/templates/:id`                                 | `admin:access`   | Detalle completo                                                                        |
| PATCH  | `/admin/email/templates/:id`                                 | `catalog:manage` | Actualiza campos; incrementa `version` y crea un snapshot                               |
| DELETE | `/admin/email/templates/:id`                                 | `catalog:manage` | Elimina la plantilla e invalida su caché de publicada                                   |
| POST   | `/admin/email/templates/:id/publish`                         | `catalog:manage` | Valida variables, publica, reseedea la caché, crea una versión                          |
| POST   | `/admin/email/templates/:id/test`                            | `catalog:manage` | Renderiza el borrador con variables provistas y lo envía                                |
| GET    | `/admin/email/templates/:id/versions`                        | `admin:access`   | Historial de versiones, paginado                                                        |
| POST   | `/admin/email/templates/:id/versions/:versionNumber/restore` | `catalog:manage` | Aplica un snapshot anterior al borrador (no publica)                                    |
| GET    | `/admin/email/layouts`                                       | `admin:access`   | Lista todos los layouts                                                                 |
| POST   | `/admin/email/layouts`                                       | `catalog:manage` | Crea un layout (valida que `html` incluya `{{content}}`)                                |
| PATCH  | `/admin/email/layouts/:id`                                   | `catalog:manage` | Actualiza un layout                                                                     |
| DELETE | `/admin/email/layouts/:id`                                   | `catalog:manage` | Elimina un layout (las plantillas que lo usaban quedan sin layout, `onDelete: SetNull`) |

## Auditoría

`AuditLogRepositoryPort` registra: `email_template.created`, `.updated`, `.deleted`, `.published`, `.test_sent`, `.version_restored`, `email_layout.created`, `.updated`, `.deleted`.

## SDK

- `packages/sdk/src/email-templates.types.ts`: `EmailTemplate`, `EmailLayout`, `EmailTemplateVersion`, inputs de creación/actualización, `TestSendEmailTemplateInput`/`Result`.
- `api-client.ts`: CRUD completo de templates y layouts, más `publishEmailTemplate`, `testSendEmailTemplate`, `listEmailTemplateVersions`, `restoreEmailTemplateVersion`.

## Frontend

- **Admin**: `/email-templates` — listado filtrable por estado. `/email-templates/new` — creación mínima (nombre, clave, idioma, asunto). `/email-templates/:id` — Template Editor (asunto/HTML/texto plano/layout), Variable Inspector (extrae `{{variable}}` del contenido y ofrece un input de valor de ejemplo por cada una), Email Preview (interpolación local en un `<iframe>`, mismo patrón `{{variable}}` que el backend, solo para visualización antes de guardar), Test Send, Version History con restaurar, botón "Publicar". `/email-layouts` — Layout Editor (crear/editar/eliminar, con el mismo requisito de `{{content}}`).
- **Storefront**: sin cambios — módulo puramente administrativo, sin endpoint público (spec §2 "APIs autenticadas").

## Verificación en vivo

Contra Railway (Postgres + Redis reales), con un administrador de prueba (`SUPER_ADMIN`, `catalog:manage`) y un segundo usuario de prueba con rol `SUPPORT` (solo `admin:access`):

**Por API (curl)**: creación de un layout con `{{content}}`; un layout sin ese placeholder devuelve `400 INVALID_EMAIL_TEMPLATE`; creación de una plantilla `order.confirmation`/`es`; una clave+idioma duplicados devuelve `409 DUPLICATE_EMAIL_TEMPLATE_KEY`; asociar el layout vía `PATCH` incrementa `version` de 1 a 2; Test Send con variables completas devuelve el HTML compuesto con el layout, la variable `name` escapada en el HTML pero intacta en el texto plano, y sin variables faltantes; Test Send con una variable faltante la reporta en `missingVariables` sin bloquear el envío (confirmado en el log: `[SMTP no configurado] Correo para... `, ya que este entorno no tiene `SMTP_HOST`); publicar con llaves de variable sin cerrar en el asunto devuelve `400 INVALID_EMAIL_TEMPLATE` sin cambiar el estado; corregido el asunto, publicar cambia el estado a `PUBLISHED`; el historial de versiones acumula una entrada por cada `PATCH` y cada publicación; restaurar una versión anterior revierte el contenido (incluyendo quitar el layout) sin tocar el estado `PUBLISHED` vigente; una versión inexistente devuelve `404`; el usuario `SUPPORT` puede hacer `GET` (200) pero no `PATCH` (403) en templates y layouts; sin token, `401`. El log de auditoría registra los ocho tipos de evento esperados.

**Por navegador**: en `apps/admin`, `/email-templates` muestra el listado real (nombre, clave, idioma, estado, versión); `/email-templates/:id` carga el contenido real de la plantilla, detecta correctamente las variables `{{orderId}}`/`{{name}}` en el Variable Inspector, y muestra las 6 versiones acumuladas durante la verificación con su acción "Restaurar".

La plantilla y el layout de ejemplo creados durante la verificación (`order.confirmation`/`es`, `Layout base`) se dejaron en Railway como datos de ejemplo funcionales — la plantilla quedó en su estado final limpio (`PUBLISHED`, sin llaves rotas, sin layout asociado tras la restauración de prueba).

## Alcance diferido

- **Integración activa con Orders/Payments/Customer Service/Notifications** (spec §13 Definition of Done) — el módulo expone `EmailTemplateRepositoryPort`/casos de uso de forma que esos módulos puedan resolver y enviar una plantilla por `key`+`language`+variables sin cambios estructurales, pero ninguno de ellos se modificó todavía para invocarlo; 034 (Notifications) ni siquiera existe aún en este sprint.
- **Editor visual WYSIWYG** (spec §6 "editor visual") — el Template Editor es un `<textarea>` de HTML crudo con Live Preview en un `<iframe>`, no un editor de bloques arrastrables; mismo tipo de compensación que el editor de bloques JSON de CMS Pages (026) frente a un editor completamente visual.
- **Validación de variables contra un catálogo por `key`** — "validar variables antes de publicar" se implementó como validación sintáctica (llaves balanceadas), no semántica, porque la spec no define qué variables son válidas para cada `key` de plantilla.
