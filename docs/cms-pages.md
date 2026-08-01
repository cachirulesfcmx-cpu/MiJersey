# CMS Pages

Implementación de [`docs/prompts/026-CMS-Pages.md`](prompts/026-CMS-Pages.md). Módulo nuevo (`apps/api/src/modules/cms`) que agrega páginas estáticas construidas por bloques reutilizables, con borradores, publicación programada, versionado con restauración y caché de páginas publicadas.

## SEO como columnas propias, no el `SeoMetadata` polimórfico de 012

La spec lista `seoTitle`/`seoDescription` como columnas propias de `Page` (§3), a diferencia de Product/Category/Brand, que nunca tuvieron esas columnas y por eso justificaron la tabla polimórfica `SeoMetadata` de 012-Product-SEO. Reutilizar esa tabla para solo dos campos habría sido sobre-ingeniería frente a lo que la spec pide como "mínimo" — `Page` guarda `seoTitle`/`seoDescription` directamente, y el storefront los usa en `generateMetadata` con fallback al `title` de la página.

## Bloques: tipos validados en el dominio, no en el esquema

`PageBlock.type` es un `String` libre en Prisma, no un enum — la validación de forma vive en `validatePageBlockConfig` (dominio), con seis tipos mínimos (`RICH_TEXT`, `IMAGE`, `HTML`, `HERO`, `CTA`, `SPACER`), mismo criterio que `validateHomeSectionConfig` (013): suficiente para detectar configuraciones incompletas antes de guardar, sin construir un esquema JSON completo. Actualizar los bloques de una página reemplaza el conjunto completo (`deleteMany` + `create`), el mismo patrón que las reglas de Promotion (024).

## Publicación programada sin cron: se deriva y se persiste en la lectura

`PublishPageUseCase` decide `PUBLISHED` (inmediato) o `SCHEDULED` (fecha futura) según `publishAt`. No hay un job en segundo plano que promueva `SCHEDULED → PUBLISHED`: `GetPublishedPageUseCase` compara `publishedAt` contra `now()` en cada lectura pública y, si la fecha ya llegó, **persiste** la promoción (`repository.updateStatus`) antes de responder — el primer visitante después de la hora programada dispara el cambio, que después queda reflejado también en el panel de administración. Este es el mismo criterio de "derivar sin infraestructura adicional" que el motor de SLA de Support (025), con la diferencia de que aquí sí conviene persistir el resultado en vez de solo derivarlo en memoria, porque el estado de publicación es un dato que el admin necesita ver correctamente sin recalcularlo cada vez.

## Versionado: snapshot completo, no campo/valor

A diferencia de `OrderStatusHistory` (021, campo/valor genérico), una versión de página necesita reconstruir el árbol completo de bloques para poder restaurarlo — `PageVersion.snapshot` es un JSON completo (título, slug, estado, plantilla, SEO y bloques) por versión, con un `versionNumber` incremental por página. Cada creación y actualización de una página genera una versión nueva; publicar también genera una (para poder distinguir "cómo se veía justo al publicarse"). Restaurar una versión anterior **no borra historial**: aplica el contenido de esa versión (título, slug, plantilla, SEO, bloques) y crea una versión nueva con ese resultado — el registro de auditoría `cms.page.version_restored` deja constancia de cuál fue el origen. Restaurar **no toca el estado de publicación actual** (`UpdatePageData` no incluye `status`): revertir el contenido de una página publicada a una versión que era borrador no la despublica accidentalmente.

## Caché de páginas publicadas, invalidada en cada escritura relevante

`CmsCacheService` sigue el mismo patrón cache-aside de `TaxonomyCacheService` (006): clave `cms:public:page:{slug}`, TTL de 60 s, poblada en `GetPublishedPageUseCase` y invalidada explícitamente en `create`/`update`/`delete`/`publish`/`restore` cuando la página afectada está (o estaba) publicada. Un cambio de slug invalida ambas claves (la anterior y la nueva) para no dejar una entrada obsoleta.

## Endpoints

| Método | Ruta                                                   | Auth             | Descripción                                                            |
| ------ | ------------------------------------------------------ | ---------------- | ---------------------------------------------------------------------- |
| GET    | `/pages/:slug`                                         | Público          | Página publicada, cacheada; promueve `SCHEDULED` vencido a `PUBLISHED` |
| GET    | `/admin/cms/pages`                                     | `admin:access`   | Listado paginado, filtrable por estado                                 |
| POST   | `/admin/cms/pages`                                     | `catalog:manage` | Crea una página en `DRAFT` con su primera versión                      |
| GET    | `/admin/cms/pages/:id`                                 | `admin:access`   | Detalle completo con bloques                                           |
| PATCH  | `/admin/cms/pages/:id`                                 | `catalog:manage` | Actualiza título/slug/plantilla/SEO/bloques; crea una nueva versión    |
| DELETE | `/admin/cms/pages/:id`                                 | `catalog:manage` | Elimina la página e invalida su caché                                  |
| POST   | `/admin/cms/pages/:id/publish`                         | `catalog:manage` | Publica inmediatamente o programa (`publishAt` futuro)                 |
| GET    | `/admin/cms/pages/:id/versions`                        | `admin:access`   | Historial de versiones, paginado                                       |
| POST   | `/admin/cms/pages/:id/versions/:versionNumber/restore` | `catalog:manage` | Restaura el contenido de una versión anterior                          |

Las mutaciones usan `catalog:manage` (no un permiso `cms:manage` dedicado) — mismo criterio que Home Sections (013) y SEO (012): en este sistema, `catalog:manage` funciona como el permiso de "editor de contenido publicable", otorgado a `ADMIN` y `EDITOR`, mientras que `admin:access` cubre solo lectura administrativa.

## Auditoría

`AuditLogRepositoryPort` (Identity) registra: `cms.page.created`, `cms.page.updated`, `cms.page.deleted`, `cms.page.published`, `cms.page.version_restored`.

## SDK

- `packages/sdk/src/cms.types.ts`: `Page`, `PageBlock`, `PageVersion`, `PageStatus`, inputs de creación/actualización/publicación.
- `api-client.ts`: `getPublishedPage`, `listPages`, `getPage`, `createPage`, `updatePage`, `deletePage`, `publishPage`, `listPageVersions`, `restorePageVersion`.

## Frontend

- **Admin**: `/cms-pages` ("Páginas") — Page Builder: listado con filtro de estado. `/cms-pages/new` — creación mínima (título + slug). `/cms-pages/:id` — Page Editor: título/slug/plantilla/SEO, editor de bloques (tipo + posición + configuración JSON por bloque — una compensación deliberada frente a un editor visual completo por tipo, dado el alcance de este sprint), publicación inmediata o programada (`datetime-local`), y Version History con botón de restaurar por versión.
- **Storefront**: `/pages/:slug` (componente de servidor) — `generateMetadata` usa `seoTitle`/`seoDescription` con fallback al título; renderiza los bloques según su tipo (texto enriquecido/HTML vía `dangerouslySetInnerHTML`, imagen, hero, CTA, espaciador). Una página no publicada, programada a futuro, o inexistente responde `notFound()`.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): un administrador de prueba (rol `ADMIN`, con `catalog:manage`) y un cliente de prueba.

**Por API (curl)**: creación de una página con dos bloques válidos (`RICH_TEXT` + `HERO`); slug duplicado devuelve `409`; un bloque con configuración incompleta devuelve `400 INVALID_PAGE_BLOCK`; el acceso público antes de publicar devuelve `404`; tras publicar, el público la ve; actualizar el título de una página publicada invalida la caché y el público ve el cambio de inmediato; el historial de versiones acumula una versión por creación/actualización/publicación/restauración sin perder las anteriores; restaurar la versión 1 revierte el título pero mantiene el estado `PUBLISHED` (no lo que decía la versión restaurada); una página programada 3 segundos en el futuro responde `404` hasta que la fecha llega, y el primer `GET` público después de esa fecha la promueve a `PUBLISHED` de forma persistente (confirmado también desde el panel de administración); endpoints admin sin token devuelven `401`, con token de cliente (sin `admin:access`) devuelven `403`. El log de auditoría registra `cms.page.created`, `.updated`, `.published` y `.version_restored`.

**Por navegador**: en `apps/admin`, `/cms-pages` muestra el listado real con estado/plantilla/fecha; `/cms-pages/:id` permite agregar un bloque (verificado: un bloque `RICH_TEXT` vacío dispara el error de validación del backend, "html es obligatorio", visible en la UI), quitarlo y guardar exitosamente, y muestra las 4 versiones reales generadas durante la prueba con su botón de restaurar. En el storefront, `/pages/sobre-nosotros` renderiza el bloque de texto y el bloque hero con los datos reales, y el título de la pestaña refleja el `seoTitle` configurado ("Sobre MiJersey").

Toda la data de prueba (administrador, cliente, páginas, bloques, versiones) se eliminó de Railway al finalizar.

## Alcance diferido

- **Editor visual por tipo de bloque** — el editor admin usa un textarea JSON por bloque en vez de un formulario dedicado por tipo (imagen con selector de Media Library, hero con campos individuales, etc.); es un editor real y funcional, pero no la experiencia "sin código" completa que un Page Builder de producción tendría.
- **Reutilización de bloques entre páginas como referencias compartidas** — cada `PageBlock` pertenece a una sola página; "bloques reutilizables" (spec §2/§4) se interpretó como una librería de _tipos_ de bloque disponibles para cualquier página, no instancias de fila compartidas entre páginas — sin lo cual editar un bloque "compartido" afectaría silenciosamente otras páginas, un riesgo no solicitado explícitamente por el criterio de aceptación.
- **Carga diferida del editor** (spec §8) — el editor admin se carga junto con el resto de la página; no hay code-splitting dedicado para el Page Builder en este sprint.
- **Renderizado eficiente avanzado / SSG** — el render público usa SSR bajo demanda (componente de servidor con `fetch` en cada request); no hay generación estática ni ISR configurado para páginas CMS todavía.
