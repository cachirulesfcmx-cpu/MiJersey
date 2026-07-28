# Marcas (Brands)

Implementación de [`docs/prompts/011-Brands.md`](prompts/011-Brands.md). Vive en su propio módulo (`apps/api/src/modules/brands`), desacoplado del catálogo: `Brand` es una entidad propia, y la única columna que Brands posee en exclusiva sobre la tabla de Catalog es `Product.brandId` (una relación 1-a-muchos simple, no una tabla de unión como `ProductCategory` en Taxonomy) — consultada y escrita a través de un `ProductQueryPort` propio, sin que `CatalogModule` necesite saber que Brands existe.

## Modelo de dominio

- **Brand**: `slug`/`name` únicos, `description`/`shortDescription`, `logoMediaId`/`coverMediaId` (IDs de `MediaAsset` — ver más abajo), `website`, `country`, `status` (`ACTIVE`|`ARCHIVED`, mismo patrón que Warehouse/Attribute), `sortOrder`.
- **Product.brandId**: columna nullable en `products` con `onDelete: SetNull` — "un producto pertenece a una marca como máximo" (spec §4) se modela como relación simple, no como join table.

## `brandId` es propiedad exclusiva de Brands

Aunque `products` es la tabla de Catalog, `CatalogModule` nunca lee ni escribe `brandId`: `ProductEntity` no lo expone (se mantiene "puro", igual que no expone categorías ni atributos). Todo el acceso pasa por el `ProductQueryPort` de Brands (`exists`, `findByIds`, `countByBrand`, `findByBrand`, `assignToBrand`, `unassignFromBrand`, `unassignAllFromBrand`), que opera directamente sobre la tabla compartida vía Prisma sin importar `CatalogModule` — mismo espíritu que Taxonomy siendo dueña exclusiva de `product_categories`.

## Reglas de negocio

- **Nombre y slug únicos** (spec §4), validados igual que en Category/Attribute/Warehouse.
- **Un producto, una marca como máximo**: `AssignProductsToBrandUseCase` siempre reemplaza cualquier marca previa del producto (un simple `UPDATE ... SET brandId = ?`, sin necesidad de "desasignar primero").
- **No eliminar una marca con productos sin acción explícita** (spec §4): `DeleteBrandUseCase` cuenta los productos asociados; si hay alguno y no se pasó `force: true`, lanza `BrandHasProductsError` (409). Con `force: true`, desasigna todos los productos (`brandId = null`) y continúa con el borrado — la "acción explícita" que pide el spec es ese flag.

## Integración con Media Library (010)

`logoMediaId`/`coverMediaId` son columnas `String?` simples, **sin relación de Prisma** hacia `MediaAsset` — a propósito: el diseño de 010 existe justamente para que un consumidor no necesite una FK directa. En su lugar, Brands inyecta `MediaUsageService` (exportado por `MediaModule`) y:

- Al crear/actualizar una marca con un logo o cover nuevo, llama a `recordUsage(mediaId, 'brand.logo'|'brand.cover', brandId)` — esto valida que el asset exista (lanza `MediaAssetNotFoundError` si no) y registra el uso, de forma que `DELETE /admin/media/:id` en Media Library se bloquea mientras la marca lo siga usando.
- Al cambiar o quitar un logo/cover, llama a `removeUsage(...)` sobre el anterior antes de registrar el nuevo.
- Al eliminar una marca, libera ambas referencias de uso antes del borrado.

Como los endpoints públicos de Media son solo administrativos, el storefront no puede resolver `logoMediaId` por sí mismo. Por eso `MediaUsageService` expone `resolveUrls(mediaId)`, y las respuestas públicas de Brands (`GetPublicBrandUseCase`/`ListPublicBrandsUseCase`) devuelven una vista enriquecida (`PublicBrandView`) con `logoUrl`/`coverUrl` ya resueltas — el storefront nunca llama a un endpoint de Media.

## Endpoints

| Método | Ruta                              | Permiso          | Descripción                                                   |
| ------ | --------------------------------- | ---------------- | ------------------------------------------------------------- |
| GET    | `/admin/brands`                   | `admin:access`   | Lista paginada; filtros por búsqueda y estado                 |
| GET    | `/admin/brands/:id`               | `admin:access`   | Detalle                                                       |
| POST   | `/admin/brands`                   | `catalog:manage` | Alta                                                          |
| PATCH  | `/admin/brands/reorder`           | `catalog:manage` | Reordena por `sortOrder`                                      |
| PATCH  | `/admin/brands/:id`               | `catalog:manage` | Edición (incluye cambio de logo/cover/estado)                 |
| DELETE | `/admin/brands/:id?force=true`    | `catalog:manage` | Bloqueado (409) si tiene productos, salvo `force=true`        |
| GET    | `/admin/brands/:id/products`      | `admin:access`   | Productos asignados (paginado)                                |
| POST   | `/admin/brands/:id/products`      | `catalog:manage` | Asigna productos en bloque (reemplaza su marca previa)        |
| DELETE | `/admin/brands/:id/products/:pid` | `catalog:manage` | Desasigna un producto                                         |
| GET    | `/brands`                         | público          | Marcas `ACTIVE`, con `logoUrl` resuelta                       |
| GET    | `/brands/:slug`                   | público          | Detalle de marca `ACTIVE`, con `logoUrl`/`coverUrl` resueltas |
| GET    | `/brands/:slug/products`          | público          | Productos `ACTIVE`+`PUBLIC` de la marca; `sortBy`/`sortDir`   |

`PATCH /admin/brands/reorder` se declara antes que `PATCH /admin/brands/:id` en el controlador para que Express no confunda `reorder` con un id (mismo caso que 005/006/007/008/009/010).

## Errores mapeados (`BrandExceptionFilter`)

| Error                         | HTTP | Motivo                                              |
| ----------------------------- | ---- | --------------------------------------------------- |
| `BrandNotFoundError`          | 404  | —                                                   |
| `BrandSlugAlreadyExistsError` | 409  | —                                                   |
| `BrandNameAlreadyExistsError` | 409  | —                                                   |
| `BrandHasProductsError`       | 409  | Tiene productos asociados y no se pasó `force=true` |
| `ProductNotFoundError`        | 404  | Un `productId` de la asignación masiva no existe    |
| `InvalidSlugError`            | 400  | —                                                   |

## Auditoría

Namespace `brand.*`: `brand.created`, `brand.updated`, `brand.deleted` (incluye `unassignedProducts` en los metadatos si se usó `force`), `brand.reordered`, `brand.products.assigned`, `brand.products.removed`.

## Permisos

Reutiliza `admin:access` (lecturas) y `catalog:manage` (escrituras) — mismo criterio que Taxonomy/Variants/Attributes/Inventory/Media.

## Frontend

- **`apps/admin` — `/brands`**: listado con búsqueda/filtro de estado, alta, edición, archivado y borrado (con confirmación en dos pasos si la marca tiene productos: el primer intento explica el conflicto, el segundo click reenvía `force=true`).
- **`apps/admin` — `/brands/:id`**: formulario de edición con `MediaPicker` (selector inline de logo/cover que lista imágenes de la Media Library, 010) y un panel de productos asignados con buscador (por nombre/SKU) para asignar y botón para quitar.
- **`apps/web` — `/brands`**: índice público de marcas activas con su logo.
- **`apps/web` — `/brands/:slug`**: página de marca con banner (cover), logo, descripción, sitio web, breadcrumbs, y listado paginado de productos con ordenamiento (nombre / más recientes).

## Verificación en vivo

Contra Railway (Postgres + Redis reales): subida de un logo real a Media Library → creación de marca con ese logo (verificado el registro de uso: intentar borrar el logo desde Media Library se bloquea con 409 mientras la marca lo use) → marca duplicada bloqueada (409) → creación y publicación de un producto → asignación a la marca → intento de borrado sin `force` bloqueado (409 `BRAND_HAS_PRODUCTS`) → borrado con `force=true` (204, verificado en base de datos que `product.brandId` quedó en `null` y que el logo quedó libre para borrarse) → endpoints públicos (`/brands`, `/brands/:slug`, `/brands/:slug/products`) devolviendo `logoUrl`/`coverUrl` ya resueltas. Repetido en las interfaces: alta de marca, selección de logo vía `MediaPicker`, búsqueda y asignación de un producto desde `/brands/:id`, y visualización de la página pública de marca en `apps/web` (banner, logo, breadcrumbs, listado de productos, ordenamiento). Todos los datos de prueba se eliminaron de Railway al finalizar.

## Alcance diferido

No se integra código con 012-Product-SEO/014-Product-Listing/015-Product-Detail en este sprint — la Definition of Done pide que la integración sea posible "sin cambios estructurales", garantizado por `PublicBrandView`/`ProductQueryPort`, no por adelantar esos módulos (014/015 aún no existen). El listado público de productos de marca solo admite orden por nombre/fecha (sin filtros por atributo): construir un filtro completo reutilizando `SearchProductsUseCase` (008) queda para cuando 014-Product-Listing defina cómo debe verse esa experiencia a nivel de todo el storefront, no solo para marcas. Tampoco hay UI de reordenamiento drag-and-drop para `sortOrder` (el endpoint existe, pero el spec de frontend no pide una pantalla de reordenamiento explícita, igual que Inventory no construyó UI para reserve/release en 009).
