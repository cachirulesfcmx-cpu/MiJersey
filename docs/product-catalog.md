# Catálogo de productos

Implementación de [`docs/prompts/005-Product-Catalog.md`](prompts/005-Product-Catalog.md). El dominio vive en `apps/api/src/modules/catalog`, siguiendo las mismas capas domain/application/infrastructure/presentation que Identity y Administration. Es la base sobre la que se construyen sin cambios estructurales los documentos 006 (Categorías), 007 (Variantes), 008 (Atributos/Filtros), 009 (Inventario) y 012 (SEO de producto).

## Modelo de dominio

`Product`: `id`, `sku`, `slug`, `name`, `shortDescription`, `description`, `status` (`DRAFT` | `ACTIVE` | `ARCHIVED`), `visibility` (`PUBLIC` | `HIDDEN`), `type` (`PHYSICAL` | `DIGITAL`), `deletedAt` (eliminación lógica), `createdAt`, `updatedAt`.

- **SKU**: inmutable una vez creado el producto (no aparece en `UpdateProductDto`). Normalizado a mayúsculas; validado con `Sku` value object (`[A-Z0-9][A-Z0-9-]{1,62}[A-Z0-9]`).
- **Slug**: normalizado a minúsculas; validado con `Slug` value object (`[a-z0-9]+(-[a-z0-9]+)*`). Si no se envía al crear, se deriva del nombre con `slugify()` (`@mijersey/shared-utils`, reutilizable por 006-Categories).
- **Eliminación lógica**: `DeleteProductUseCase`/`BulkDeleteProductsUseCase` solo setean `deletedAt`. `PrismaProductRepository` excluye `deletedAt != null` de **todas** las lecturas (`findById`, `findBySlug`, `findMany`, `count`, `existsBySku`, `existsBySlug`) — una vez eliminado, el producto desaparece de cualquier vista (admin o pública) pero el registro persiste para auditoría. Su SKU/slug quedan libres para un producto nuevo.
- **Publicación**: un producto solo es visible en la API pública cuando `status = ACTIVE` **y** `visibility = PUBLIC` a la vez; son ejes independientes (un producto puede estar `ACTIVE` pero `HIDDEN`, por ejemplo, mientras se termina de completar su ficha).

## Endpoints

Separación admin/pública tal como pide la especificación (§8):

| Método | Ruta                            | Permiso          | Descripción                                                                            |
| ------ | ------------------------------- | ---------------- | -------------------------------------------------------------------------------------- |
| GET    | `/admin/products`               | `admin:access`   | Listado paginado, con búsqueda/filtros/orden                                           |
| GET    | `/admin/products/:id`           | `admin:access`   | Detalle por id (cualquier estado)                                                      |
| POST   | `/admin/products`               | `catalog:manage` | Alta                                                                                   |
| PATCH  | `/admin/products/:id`           | `catalog:manage` | Edición (no incluye `sku`)                                                             |
| PATCH  | `/admin/products/:id/publish`   | `catalog:manage` | `status → ACTIVE`                                                                      |
| PATCH  | `/admin/products/:id/archive`   | `catalog:manage` | `status → ARCHIVED`                                                                    |
| POST   | `/admin/products/:id/duplicate` | `catalog:manage` | Clona como `DRAFT`/`HIDDEN`, con sufijo `-COPY`/`-copy` (y `-2`, `-3`... si ya existe) |
| DELETE | `/admin/products/:id`           | `catalog:manage` | Eliminación lógica                                                                     |
| PATCH  | `/admin/products/bulk/status`   | `catalog:manage` | Acción masiva: publicar/archivar varios a la vez                                       |
| POST   | `/admin/products/bulk/delete`   | `catalog:manage` | Acción masiva: eliminación lógica de varios                                            |
| GET    | `/products`                     | Público          | Solo `ACTIVE` + `PUBLIC`; paginado y con búsqueda                                      |
| GET    | `/products/:slug`               | Público          | Solo `ACTIVE` + `PUBLIC`; 404 si no cumple ambas condiciones                           |

El bulk-delete usa `POST /admin/products/bulk/delete` en vez de `DELETE /admin/products/bulk` a propósito: NestJS registra las rutas de un controller en el orden en que se declaran los métodos, y un `DELETE` de un solo segmento (`bulk`) colisionaría con `DELETE /admin/products/:id` (Express interpretaría `bulk` como el `:id`). Separar el bulk-delete en dos segmentos de ruta evita el conflicto sin depender del orden de declaración.

## Permisos

Nuevo permiso `catalog:manage` (sembrado en `apps/api/prisma/seed.ts`) para `SUPER_ADMIN`, `ADMIN` y `EDITOR` — las mismas operaciones de escritura del catálogo. La lectura admin (`GET`) solo requiere `admin:access`, igual que el resto del panel.

## Auditoría y métricas del dashboard

`Catalog` no tiene su propio módulo de auditoría: escribe en la misma tabla `audit_logs` a través del `AuditLogRepositoryPort` de Identity (por eso `IdentityModule` ahora exporta también `AUDIT_LOG_REPOSITORY`, además de `PERMISSION_REPOSITORY`). Se registran `catalog.product.created`, `.updated`, `.published`, `.archived`, `.duplicated`, `.deleted`, `.bulk_status_updated` y `.bulk_deleted`.

`GetProductStatsUseCase` se exporta desde `CatalogModule`; `AdministrationModule` lo importa para que `GetDashboardMetricsUseCase` reporte `products: { value: <total>, available: true }` en vez del placeholder de 004. `sales`, `orders`, `revenue`, `conversionRate` e `inventoryAlerts` siguen `available: false` hasta Pedidos (021) e Inventario (009).

## Frontend (`apps/admin`)

- **Listado** (`/products`): `DataTable` con búsqueda (debounced 300 ms), filtros por estado/tipo, paginación, selección múltiple y acciones masivas (Publicar/Archivar/Eliminar). Las acciones de escritura solo se muestran si el usuario tiene `catalog:manage`.
- **Alta/edición** (`/products/new`, `/products/[id]`): comparten `ProductForm`; en edición el campo SKU se deshabilita (es inmutable en el backend).
- `packages/ui`: `DataTableColumn.header` pasó de `string` a `ReactNode` para poder poner un checkbox de "seleccionar todos" en el encabezado de la tabla — cambio compatible hacia atrás (un `string` sigue siendo un `ReactNode` válido).

No se construyeron páginas de storefront (listado/detalle público): esas llegan con 013-Storefront-Home, 014-Product-Listing y 015-Product-Detail. Este sprint solo entrega la API pública que esas páginas consumirán.

## Alcance diferido

Fuera de este sprint, tal como delimita la especificación: variantes (007), inventario/stock (009), atributos y filtros de catálogo (008), SEO avanzado — meta tags, canonical, etc. (012) y categorías/colecciones (006).
