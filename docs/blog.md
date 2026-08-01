# Blog

Implementación de [`docs/prompts/027-Blog.md`](prompts/027-Blog.md). Módulo nuevo (`apps/api/src/modules/blog`) que agrega artículos editoriales con categorías, etiquetas, autor, borradores, publicación programada, versionado, contenido relacionado y SEO (canonical, Open Graph, Twitter Cards, JSON-LD Article, sitemap, RSS).

## Autor con FK real a `User`, a diferencia de Ticket/Payment/Shipment

`Post.authorId` tiene una relación de Prisma real hacia `User` (`onDelete: Restrict`) — a diferencia de `Ticket.customerId`, `Payment.orderId` o `Shipment.orderId`, que deliberadamente son ids desacoplados de contextos periféricos. Los autores son usuarios internos (Admin/Editor) del mismo dominio Identity, y el Author Profile del storefront necesita el nombre real, mismo criterio que `Address`/`Wishlist` (019).

## `BlogCategory`/`BlogTag`, no `Category`/`Tag`

Nombrados así para no colisionar con la taxonomía de Catalog (`Category`, 006) ni con `AssetTag` de Media Library (010) — son conceptos independientes; un artículo de blog no pertenece a una categoría de producto. La relación con `Post` es muchos-a-muchos (`PostCategory`/`PostTag`), permitiendo múltiples categorías y etiquetas por artículo (spec §4).

## SEO como columnas propias, no el `SeoMetadata` polimórfico de 012

Igual que `Page` (026), `Post.seoTitle`/`seoDescription` son columnas propias — la spec los lista como campos "mínimos" del artículo, y reutilizar la tabla polimórfica de 012 para solo dos campos sería sobre-ingeniería. El resto de los requisitos de SEO (canonical, Open Graph, Twitter Cards, JSON-LD Article) se resuelven en el storefront (`apps/web/src/app/blog/[slug]/page.tsx`), derivándolos de `seoTitle`/`seoDescription`/`excerpt`/`featuredImage` más un `NEXT_PUBLIC_WEB_URL` nuevo (con `metadataBase` en el layout raíz) para construir URLs absolutas — un campo que no existía porque ninguna página previa del storefront necesitaba metadatos completamente calificados.

## Publicación programada: mismo criterio "derivar y persistir en la lectura" que CMS Pages, extendido a listados

`PublishPostUseCase` decide `PUBLISHED` o `SCHEDULED` según `publishAt`, igual que `PublishPageUseCase` (026). La diferencia: Blog sí tiene un listado público (`GET /blog/posts`, Blog Home/Category/Tag Archive), así que la promoción de `SCHEDULED` vencidos no puede vivir solo en la lectura individual por slug — un artículo vencido debe aparecer también en el listado. `PostRepositoryPort.promoteDuePosts(now)` promueve en lote todos los `SCHEDULED` vencidos (y devuelve sus slugs para invalidar caché) y se invoca tanto en `GetPublishedPostUseCase` como en `ListPublishedPostsUseCase` antes de resolver — Page nunca necesitó resolver este caso porque nunca tuvo un índice público.

## Versionado: snapshot completo, igual que CMS Pages

`PostVersion.snapshot` es un JSON completo (título, slug, estado, extracto, contenido, imagen destacada, SEO, y los ids de categorías/etiquetas asignadas) por versión — mismo criterio que `PageVersion` (026): reconstruir el artículo completo para poder restaurarlo, en vez de un registro campo/valor. Restaurar una versión anterior no borra historial (crea una versión nueva) y no toca el estado de publicación vigente (`UpdatePostData` no incluye `status`).

## Contenido relacionado: relevancia simple en el caso de uso, filtrado en el repositorio

`GetRelatedPostsUseCase` (spec §4 "Generar contenido relacionado por categorías y etiquetas") pide al repositorio los artículos publicados que comparten al menos una categoría o etiqueta con el actual (`findPublishedCandidatesForRelated`), y luego los ordena por número de coincidencias compartidas (categorías + etiquetas), y en empate por fecha de publicación más reciente. Los candidatos sin ninguna coincidencia real se descartan explícitamente — sin esto, el filtro `OR` del repositorio (categoría o etiqueta) podría devolver falsos positivos si algún día se relaja la consulta. No es un motor de recomendación: es una relevancia simple y determinista, suficiente para el criterio de aceptación.

## Caché de artículos publicados

`BlogCacheService` sigue el mismo patrón cache-aside que `CmsCacheService` (026) y `TaxonomyCacheService` (006): clave `blog:public:post:{slug}`, TTL de 60 s, poblada en `GetPublishedPostUseCase` e invalidada en cada escritura relevante (crear, actualizar, publicar, eliminar, restaurar, y en la promoción en lote de `SCHEDULED` vencidos). El listado público (`GET /blog/posts`) no se cachea — su clave dependería de página y filtros de categoría/etiqueta, complejidad no justificada para este sprint.

## Sitemap: extensión del generador existente de SEO (012), no uno nuevo

En vez de construir un sitemap propio del blog, se extendió `SitemapSourcePort`/`GenerateSitemapUseCase` (012) con `listPublicPosts()` — mismo patrón "SEO consulta la tabla ajena directamente vía Prisma, sin importar el módulo dueño" que ya usa para Catalog/Taxonomy/Brands. `Post` no se agregó al enum `SeoEntityType` (ese enum es exclusivo de entidades con registro `SeoMetadata` polimórfico, y Blog usa columnas propias); la ruta `/blog/{slug}` se arma directamente en el generador para este caso.

## RSS: propio del módulo Blog

A diferencia del sitemap, no existía precedente de RSS en el proyecto — `GenerateBlogRssUseCase` construye un feed RSS 2.0 con los 30 artículos publicados más recientes (reutilizando `findManyPublished`, que ya promueve `SCHEDULED` vencidos), expuesto en `GET /blog/rss.xml`.

## Endpoints

| Método                | Ruta                                                    | Auth             | Descripción                                                               |
| --------------------- | ------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------- |
| GET                   | `/blog/posts`                                           | Público          | Listado paginado de publicados; filtra por `category`/`tag` (slugs)       |
| GET                   | `/blog/posts/:slug`                                     | Público          | Artículo publicado, cacheado; promueve `SCHEDULED` vencido                |
| GET                   | `/blog/posts/:slug/related`                             | Público          | Contenido relacionado por categorías/etiquetas compartidas                |
| GET                   | `/blog/categories`                                      | Público          | Listado de categorías                                                     |
| GET                   | `/blog/tags`                                            | Público          | Listado de etiquetas                                                      |
| GET                   | `/blog/rss.xml`                                         | Público          | Feed RSS de los artículos publicados más recientes                        |
| GET                   | `/admin/blog/posts`                                     | `admin:access`   | Listado paginado, filtrable por estado                                    |
| POST                  | `/admin/blog/posts`                                     | `catalog:manage` | Crea un artículo en `DRAFT` con su primera versión                        |
| GET                   | `/admin/blog/posts/:id`                                 | `admin:access`   | Detalle completo                                                          |
| PATCH                 | `/admin/blog/posts/:id`                                 | `catalog:manage` | Actualiza campos/categorías/etiquetas; crea una nueva versión             |
| DELETE                | `/admin/blog/posts/:id`                                 | `catalog:manage` | Elimina el artículo e invalida su caché                                   |
| POST                  | `/admin/blog/posts/:id/publish`                         | `catalog:manage` | Publica inmediatamente o programa (`publishAt` futuro)                    |
| GET                   | `/admin/blog/posts/:id/versions`                        | `admin:access`   | Historial de versiones, paginado                                          |
| POST                  | `/admin/blog/posts/:id/versions/:versionNumber/restore` | `catalog:manage` | Restaura el contenido de una versión anterior                             |
| GET/POST/PATCH/DELETE | `/admin/blog/categories(/:id)`                          | ver arriba       | CRUD de categorías (lecturas `admin:access`, mutaciones `catalog:manage`) |
| GET/POST/PATCH/DELETE | `/admin/blog/tags(/:id)`                                | ver arriba       | CRUD de etiquetas (lecturas `admin:access`, mutaciones `catalog:manage`)  |

Las mutaciones usan `catalog:manage` — mismo criterio que CMS Pages (026), Home Sections (013) y SEO (012): el permiso de "editor de contenido publicable", otorgado a `ADMIN` y `EDITOR`.

## Auditoría

`AuditLogRepositoryPort` registra: `blog.post.created`, `blog.post.updated`, `blog.post.deleted`, `blog.post.published`, `blog.post.version_restored`.

## SDK

- `packages/sdk/src/blog.types.ts`: `Post`, `PostVersion`, `PostStatus`, `BlogCategory`, `BlogTag`, inputs de creación/actualización/publicación.
- `api-client.ts`: `listPublishedPosts`, `getPublishedPost`, `getRelatedPosts`, `listPublicBlogCategories`, `listPublicBlogTags`, más el CRUD admin de posts/categorías/etiquetas y versionado.

## Frontend

- **Admin**: `/blog-posts` — listado con filtro de estado. `/blog-posts/new` — creación mínima (título, slug, contenido; autor = usuario autenticado). `/blog-posts/:id` — editor completo (título/slug/extracto/contenido/imagen destacada/SEO, checkboxes de categorías/etiquetas, publicación inmediata o programada, Version History con restaurar). `/blog-categories` y `/blog-tags` — CRUD mínimo.
- **Storefront**: `/blog` (Blog Home, paginado), `/blog/category/:slug` y `/blog/tag/:slug` (Category/Tag Archive, mismo endpoint público con filtros), `/blog/:slug` (Article Detail: contenido, Author Profile, categorías/etiquetas, Related Posts, metadatos completos y JSON-LD Article). `PostCard`/`AuthorCard` son componentes compartidos entre estas páginas.
- **Author Profile**: se muestra como una tarjeta con iniciales + nombre junto al artículo — `User` (003) no tiene bio/avatar todavía, así que se usa el dato real mínimo disponible en vez de construir un perfil público completo fuera del alcance de este sprint.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): un administrador de prueba (rol `ADMIN`, con `catalog:manage`) y un cliente de prueba.

**Por API (curl)**: creación de un artículo con categoría y etiqueta reales; slug duplicado devuelve `409`; una categoría/etiqueta inexistente devuelve `404 BLOG_CATEGORY_NOT_FOUND`/`BLOG_TAG_NOT_FOUND`; el acceso público antes de publicar devuelve `404`; tras publicar, el público lo ve de inmediato; actualizar el título de un artículo publicado invalida la caché y el público ve el cambio sin esperar el TTL; el historial de versiones acumula una versión por creación/actualización/publicación/restauración; restaurar la versión 1 revierte el título pero mantiene el estado `PUBLISHED` vigente; un segundo artículo con la misma categoría aparece en `related` del primero y en el listado filtrado por `category`; una publicación programada 12 segundos en el futuro responde `404` hasta que la fecha llega, y el primer `GET` público después la promueve a `PUBLISHED` de forma persistente (confirmado también desde `/admin/blog/posts/:id`); `sitemap.xml` incluye las rutas `/blog/:slug` de los artículos publicados; `rss.xml` lista los artículos recientes; endpoints admin sin token devuelven `401`, con token de cliente (sin `admin:access`) devuelven `403`. El log de auditoría registra `blog.post.created`, `.published`, `.updated` y `.version_restored`.

**Por navegador**: en `apps/admin`, `/blog-posts` muestra el listado real con estado/autor; `/blog-posts/:id` permite editar campos, alternar categorías/etiquetas por checkbox, y restaurar una versión anterior (confirmado: aparece una versión nueva tras restaurar, sin perder las anteriores); `/blog-categories` administra categorías reales. En el storefront, `/blog` lista los artículos publicados; `/blog/cuidado-jersey-retro` renderiza el contenido, la tarjeta de autor, categorías/etiquetas como enlaces, artículos relacionados, y expone `canonical`/Open Graph/Twitter Card/JSON-LD `Article` correctos en el DOM; `/blog/category/:slug` y `/blog/tag/:slug` filtran correctamente.

Toda la data de prueba (administrador, cliente, artículos, categorías, etiquetas, versiones) se eliminó de Railway al finalizar.

## Alcance diferido

- **Editor enriquecido real (WYSIWYG)** — el editor admin usa un `textarea` de HTML/texto plano en vez de un editor rico tipo TipTap/Slate; el contenido se guarda y renderiza como HTML (`dangerouslySetInnerHTML`) en el storefront, pero no hay barra de formato en el admin.
- **SSG/ISR para artículos** — el render público usa SSR bajo demanda (componente de servidor con `fetch` en cada request), igual que CMS Pages (026); no hay generación estática ni revalidación incremental configurada todavía.
- **Perfil público de autor con bio/avatar** — ver sección "Author Profile" arriba; solo se muestra el nombre real, sin ampliar `User` fuera del alcance de este sprint.
- **Imágenes optimizadas** — el `featuredImage` se renderiza con `<img>` nativo, no `next/image`; no hay pipeline de optimización/redimensionado dedicado para imágenes de blog (Media Library, 010, ya resuelve subida/almacenamiento si se usa como fuente de la URL).
