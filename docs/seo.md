# SEO

Implementación de [`docs/prompts/012-Product-SEO.md`](prompts/012-Product-SEO.md). Vive en su propio módulo (`apps/api/src/modules/seo`), desacoplado de Catalog/Taxonomy/Brands: `SeoMetadata`/`Redirect` son entidades propias que referencian cualquier entidad del catálogo por `(entityType, entityId)` genérico, sin FKs de Prisma hacia `products`/`categories`/`collections`/`brands`.

## Modelo de dominio

- **SeoMetadata**: único por `(entityType, entityId)` — como máximo un registro por entidad (spec §2). `metaTitle`/`metaDescription`/`metaKeywords`/`canonicalUrl` (todos opcionales), `robots` (`INDEX_FOLLOW`|`NOINDEX_FOLLOW`|`INDEX_NOFOLLOW`|`NOINDEX_NOFOLLOW`), `ogTitle`/`ogDescription`/`ogImageMediaId`, `twitterCard` (`SUMMARY`|`SUMMARY_LARGE_IMAGE`), `structuredData` (JSON libre, validado como JSON válido en el cliente, no contra un esquema Schema.org específico).
- **Redirect**: único por `fromPath`, con `toPath` y `statusCode` (301 por defecto).
- **SeoEntityType**: `PRODUCT`|`CATEGORY`|`COLLECTION`|`BRAND`. `buildEntityPath(entityType, slug)` centraliza el mapeo a prefijo de URL (`/products`, `/categories`, `/collections`, `/brands`) — usado tanto por el sitemap como por el redirect automático.

## `SeoModule` es dependencia de Catalog/Taxonomy/Brands, no al revés

Mismo espíritu que Media (010) siendo importado por Brands: `SeoModule` exporta `SeoRedirectService` y `GetSeoMetadataUseCase`, e `CatalogModule`/`TaxonomyModule`/`BrandsModule` lo importan para consumirlos. `SeoModule` nunca importa esos tres módulos de vuelta — su único acceso a datos de catálogo es una lectura Prisma cruda vía `SitemapSourcePort`/`EntityLookupPort` para el sitemap y el SERP fallback, no un import de sus módulos NestJS. Sin dependencia circular.

## Redirección automática al cambiar el slug

`SeoRedirectService.recordSlugChange(entityType, entityId, oldSlug, newSlug)` calcula `fromPath`/`toPath` con `buildEntityPath` y hace upsert de un `Redirect` 301 keyed por `fromPath`. Se invoca desde `UpdateProductUseCase`, `UpdateCategoryUseCase`, `UpdateCollectionUseCase` y `UpdateBrandUseCase` inmediatamente después de persistir un cambio de slug — el admin no tiene que crear la redirección a mano (spec §6), aunque también puede crear/editar/borrar redirecciones manuales desde `/admin/seo/redirects`.

## Etiquetas SEO automáticas en el storefront (`PublicSeoView`)

Los endpoints públicos de detalle/listado (`/brands/:slug` por ahora; el mismo patrón se reutilizará en 013/014/015 para Category/Collection/Product) no exponen un segundo endpoint de SEO — el propio caso de uso público (`GetPublicBrandUseCase`/`ListPublicBrandsUseCase`) inyecta `GetSeoMetadataUseCase` y adjunta un campo `seo: PublicSeoView` ya resuelto a su DTO de respuesta. Esto evita que el storefront anónimo necesite llamar a `/admin/seo/:entityType/:entityId` (protegido por permisos) para poder pintar sus etiquetas.

`buildPublicSeoView()` (`domain/value-objects/public-seo-view.ts`) combina el `SeoMetadata` guardado (si existe) con valores por defecto derivados de la propia entidad (nombre → `metaTitle`, descripción → `metaDescription`, URL canónica calculada) — así toda página pública genera automáticamente sus etiquetas aunque nadie las haya configurado manualmente (spec §7), y el admin solo necesita llenar el editor para casos donde quiera un texto distinto al automático.

## Sitemap y robots.txt

`GET /sitemap.xml` y `GET /robots.txt` (rutas de nivel raíz, sin prefijo `/admin`) generan XML/texto reales a partir de las entidades públicas activas (`SitemapSourcePort`, implementado con consultas Prisma directas a `products`/`categories`/`collections`/`brands`, filtrando por estado público de cada una). El sitemap se cachea en Redis 10 minutos (`SeoCacheService`, cache-aside simple) — sin invalidación por evento: el catálogo cambia con demasiada frecuencia como para instrumentar cada escritura de cada módulo solo para este propósito, y un TTL corto es una simplificación deliberada y documentada, no un olvido.

`apps/web` no reimplementa esta lógica: `app/sitemap.xml/route.ts` y `app/robots.txt/route.ts` son Route Handlers (`export const dynamic = 'force-dynamic'`, necesario porque si no Next intenta prerenderizarlos en build time y falla si la API no está disponible) que hacen proxy directo del contenido de la API, sirviéndolo bajo el dominio del storefront (que es el que de verdad rastrean los buscadores).

## Redirecciones en el storefront

`apps/web/src/middleware.ts` intercepta toda ruta que no sea `_next`/`api`/`sitemap.xml`/`robots.txt`/un archivo estático, y llama a `GET /redirects/resolve?path=...`. Si la API devuelve una redirección, responde con `NextResponse.redirect(...)` usando el `statusCode` real (301 por defecto); si la API no responde o no hay redirección, sirve la ruta normalmente (fail-open, para que un problema transitorio de red no tumbe el storefront).

## Server Components y `generateMetadata`

Las páginas de detalle público existentes en `apps/web` (p. ej. `brands/[slug]`) eran Client Components (`'use client'`), pero las etiquetas `<title>`/`<meta>`/Open Graph que leen los crawlers (Facebook, Twitter, buscadores sin JS) requieren el export `generateMetadata` de Next.js, que solo funciona en Server Components. `apps/web/src/app/brands/[slug]/page.tsx` se convirtió en Server Component: hace `fetch` del brand vía el SDK en el servidor, exporta `generateMetadata` construyendo `title`/`description`/`alternates.canonical`/`robots`/`openGraph`/`twitter` a partir de `brand.seo`, inyecta el JSON-LD (`brand.seo.structuredData`, o un `Brand` de Schema.org sintetizado con los campos ya disponibles si nadie configuró uno manual) vía `<script type="application/ld+json">`, y delega toda la parte interactiva (orden/paginación de productos) a `BrandDetailClient.tsx`, un Client Component que recibe el `brand` ya resuelto como prop.

## Endpoints

| Método | Ruta                               | Permiso          | Descripción                                              |
| ------ | ---------------------------------- | ---------------- | -------------------------------------------------------- |
| GET    | `/admin/seo/:entityType/:entityId` | `admin:access`   | Metadata SEO de una entidad (o `null` si no configurada) |
| PATCH  | `/admin/seo/:entityType/:entityId` | `catalog:manage` | Crea/actualiza (upsert) la metadata SEO                  |
| GET    | `/admin/seo/redirects`             | `admin:access`   | Lista paginada de redirecciones                          |
| POST   | `/admin/seo/redirects`             | `catalog:manage` | Crea una redirección manual                              |
| DELETE | `/admin/seo/redirects/:id`         | `catalog:manage` | Elimina una redirección                                  |
| GET    | `/sitemap.xml`                     | público          | Sitemap XML de todas las entidades públicas              |
| GET    | `/robots.txt`                      | público          | `robots.txt` con referencia al sitemap                   |
| GET    | `/redirects/resolve?path=...`      | público          | Resuelve una ruta a su redirección (o `null`)            |

`:entityType` se valida con `ParseEnumPipe` contra `SeoEntityType` — es una validación de forma de ruta, no un error de dominio dedicado. Las rutas `/admin/seo/redirects*` se declaran antes que `/admin/seo/:entityType/:entityId` en el controlador para que Express no confunda `redirects` con un `entityType` (mismo caso que `reorder` en 005/006/007/008/009/010/011).

## Errores mapeados (`SeoExceptionFilter`)

| Error                                | HTTP | Motivo                            |
| ------------------------------------ | ---- | --------------------------------- |
| `SeoEntityNotFoundError`             | 404  | La entidad referenciada no existe |
| `RedirectNotFoundError`              | 404  | —                                 |
| `RedirectFromPathAlreadyExistsError` | 409  | `fromPath` ya existe              |
| `RedirectLoopError`                  | 400  | `fromPath` y `toPath` son iguales |

## Auditoría y permisos

Namespace `seo.*`: `seo.metadata.updated`, `seo.redirect.created`, `seo.redirect.deleted`. Reutiliza `admin:access` (lecturas) y `catalog:manage` (escrituras) — mismo criterio que Taxonomy/Variants/Attributes/Inventory/Media/Brands; no se introdujo un permiso `seo:manage` dedicado.

## Frontend

- **`apps/admin` — `SeoMetadataEditor`** (`src/components/`, reutilizable): embebido al final de los formularios de edición de Producto/Categoría/Colección/Marca. Vista previa estilo SERP (título/URL/descripción) con contadores de caracteres en vivo (70/160, los límites típicos de truncado de Google), select de `robots`, sección Open Graph con su propio `MediaPicker` para la imagen, select de tipo de Twitter Card, y textarea de JSON-LD (validado con `JSON.parse` antes de guardar). No incluye un constructor visual de Schema.org — se dejó como textarea de JSON crudo dado el alcance de tres sprints en paralelo.
- **`apps/admin` — `/redirects`**: alta simple (origen/destino), tabla paginada, borrado con confirmación. Explica que las redirecciones también se crean automáticamente al cambiar un slug.
- **`apps/web`**: ver secciones de sitemap/robots/redirects/Server Components arriba.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): creación de una marca de prueba → `GET /brands/:slug` devolviendo `seo` con fallback automático (sin metadata configurada) → `PATCH /admin/seo/BRAND/:id` con título/descripción/OG/Twitter/JSON-LD manuales → `GET /brands/:slug` reflejando los valores manuales → cambio de slug de la marca → verificado que se creó automáticamente un `Redirect` 301 (`GET /admin/seo/redirects` y `GET /redirects/resolve?path=...`) → `GET /sitemap.xml`/`GET /robots.txt` con el dominio público correcto. En `apps/web`: HTML servido por el Server Component de `/brands/:slug` inspeccionado directamente (`<title>`, `<meta name="description">`, `<link rel="canonical">`, `og:*`, `twitter:*` y el `<script type="application/ld+json">`, todos con los valores configurados manualmente); `curl -I` a la ruta antigua de la marca confirmando el 301 del middleware de redirecciones; passthrough de `/sitemap.xml` y `/robots.txt` bajo el dominio del storefront. En `apps/admin`: login, edición de la marca con `SeoMetadataEditor` mostrando la vista previa SERP y los contadores correctos, y `/redirects` listando la redirección auto-creada. Todos los datos y el usuario de prueba se eliminaron de Railway al finalizar.

## Alcance diferido

El JSON-LD es un textarea de JSON crudo, no un constructor visual por tipo de Schema.org (`Product`, `BreadcrumbList`, etc.) — queda para una iteración futura si se necesita. El sitemap no soporta paginación por `<sitemapindex>` (asume que el volumen total de URLs cabe en un único archivo); necesario revisarlo si el catálogo crece mucho. La integración de `PublicSeoView` en Category/Collection/Product queda para cuando esos endpoints públicos existan (013/014/015) — el patrón (`buildPublicSeoView` + inyectar `GetSeoMetadataUseCase` en el caso de uso público) ya está establecido y probado con Brands.
