# Categorías y colecciones

Implementación de [`docs/prompts/006-Categories-Collections.md`](prompts/006-Categories-Collections.md). El dominio vive en `apps/api/src/modules/taxonomy`, con las mismas capas domain/application/infrastructure/presentation que Identity/Catalog. Queda preparado para 007 (Variantes), 008 (Atributos/Filtros) y el storefront (013/014) sin cambios estructurales.

## Modelo de dominio

**Category**: `id`, `parentId` (autorrelación jerárquica), `slug`, `name`, `description`, `image`, `sortOrder`, `status` (`ACTIVE` | `HIDDEN`). Asociación muchos-a-muchos con `Product` vía `ProductCategory` (con `sortOrder` propio, listo para el orden de listado de 014).

**Collection**: `id`, `slug`, `name`, `description`, `type` (`MANUAL` | `SMART`), `status`, `matchType` (`ALL` | `ANY`, solo aplica a `SMART`), `rules` (`CollectionRule[]`: `field` + `operator` + `value`). Las manuales guardan su membresía en `CollectionProduct` (con `sortOrder`); las inteligentes no guardan nada — se resuelven en el momento contra `products` según sus reglas.

- **Slug**: propio de Taxonomy (`Slug` VO duplicado a propósito respecto al de Catalog — cada contexto de dominio es responsable del suyo, en vez de acoplar sus capas de dominio entre sí). Se deriva del nombre con `slugify()` si no se especifica.
- **Sin ciclos / profundidad máxima**: `category-tree.util.ts` expone `computeDepth` y `wouldCreateCycle`, usados por `CreateCategoryUseCase` y `MoveCategoryUseCase`. Límite configurable en `MAX_CATEGORY_DEPTH` (5 niveles).
- **Eliminar una categoría con hijos**: bloqueado (`CategoryHasChildrenError`, 409) — hay que mover o eliminar las subcategorías primero. A diferencia de Product (005), Category y Collection no tienen eliminación lógica: `DELETE` es un borrado real, tal como lo define la especificación en su lista mínima de endpoints.
- **Actualización automática de colecciones inteligentes**: no existe un job de sincronización. `GetCollectionUseCase`/`GetPublicCollectionUseCase` consultan los productos que cumplen las reglas en cada lectura (`ProductQueryPort.findMatchingRules`), así que un producto nuevo que cumpla la regla aparece de inmediato sin ninguna acción manual.

## Por qué Taxonomy no depende del dominio de Catalog

`ProductQueryPort` (con su implementación `PrismaProductQueryRepository`) es una vista de solo lectura de `products`, el mismo patrón CQRS que ya usa Administration para leer la auditoría que escribe Identity. Taxonomy nunca importa `ProductRepositoryPort` de Catalog ni sus value objects: solo necesita verificar existencia (`exists`, `findByIds`) y evaluar reglas (`findMatchingRules`), construyendo el `WHERE` de Prisma directamente a partir de `field`/`operator`/`value`. Esto evita acoplar el puerto de dominio de Catalog a un concepto (reglas de colección) que le es ajeno.

## Endpoints

| Método | Ruta                                         | Permiso          | Descripción                                         |
| ------ | -------------------------------------------- | ---------------- | --------------------------------------------------- |
| GET    | `/admin/categories`                          | `admin:access`   | Árbol completo (cualquier estado)                   |
| GET    | `/admin/categories/:id`                      | `admin:access`   | Detalle                                             |
| GET    | `/admin/categories/:id/path`                 | `admin:access`   | Ruta raíz → nodo (breadcrumbs)                      |
| POST   | `/admin/categories`                          | `catalog:manage` | Alta                                                |
| PATCH  | `/admin/categories/reorder`                  | `catalog:manage` | Fija `sortOrder` de un grupo de hermanas            |
| PATCH  | `/admin/categories/:id`                      | `catalog:manage` | Edición (nombre, slug, descripción, imagen, estado) |
| PATCH  | `/admin/categories/:id/move`                 | `catalog:manage` | Cambia `parentId` (valida ciclos y profundidad)     |
| DELETE | `/admin/categories/:id`                      | `catalog:manage` | Elimina (bloqueado si tiene hijos)                  |
| POST   | `/admin/categories/:id/products`             | `catalog:manage` | Asocia productos                                    |
| DELETE | `/admin/categories/:id/products/:productId`  | `catalog:manage` | Desasocia un producto                               |
| GET    | `/categories`                                | Público          | Árbol `ACTIVE`, cacheado en Redis                   |
| GET    | `/admin/collections`                         | `admin:access`   | Listado paginado                                    |
| GET    | `/admin/collections/:id`                     | `admin:access`   | Detalle + productos resueltos (paginados)           |
| POST   | `/admin/collections`                         | `catalog:manage` | Alta (con reglas iniciales si es `SMART`)           |
| PATCH  | `/admin/collections/:id`                     | `catalog:manage` | Edición de datos básicos                            |
| DELETE | `/admin/collections/:id`                     | `catalog:manage` | Elimina                                             |
| PUT    | `/admin/collections/:id/rules`               | `catalog:manage` | Reemplaza reglas + `matchType` (solo `SMART`)       |
| POST   | `/admin/collections/:id/products`            | `catalog:manage` | Agrega productos a mano (solo `MANUAL`)             |
| PATCH  | `/admin/collections/:id/products/reorder`    | `catalog:manage` | Reordena (solo `MANUAL`)                            |
| DELETE | `/admin/collections/:id/products/:productId` | `catalog:manage` | Quita un producto (solo `MANUAL`)                   |
| GET    | `/collections`                               | Público          | Solo `ACTIVE`; la consulta por defecto se cachea    |
| GET    | `/collections/:slug`                         | Público          | Productos filtrados además a `ACTIVE` + `PUBLIC`    |

`PATCH /admin/categories/bulk/delete` no existe — el bulk-delete de colecciones/productos de 005 no aplicaba aquí porque el spec de 006 no lo pide; sí se reutiliza el mismo cuidado de orden de rutas: `PATCH /admin/categories/reorder` se registra antes que `PATCH /admin/categories/:id` para que Express no confunda `reorder` con un `:id` (mismo problema que documentamos en 005 para `bulk/delete`).

## Permisos

Reutiliza `catalog:manage` (creado en 005) en vez de sumar un permiso nuevo — categorías y colecciones son, a efectos de RBAC, la misma superficie de "organización del catálogo" que gestionan `SUPER_ADMIN`/`ADMIN`/`EDITOR`.

## Caché de navegación pública (rendimiento)

`TaxonomyCacheService` implementa cache-aside sobre Redis (`RedisService`, ya global desde 001) con TTL de 60 s:

- **Árbol público de categorías**: una sola clave (`taxonomy:public:category-tree`); se invalida en cualquier creación, edición, movimiento, reordenamiento o borrado de categoría.
- **Listado público de colecciones**: solo se cachea la consulta _por defecto_ (sin búsqueda, página 1) bajo una única clave; cualquier otra combinación de filtros/paginación no pasa por caché. Se invalida al crear, editar, borrar una colección o modificar sus reglas/productos.

No se implementó paginación incremental del árbol de categorías ("carga diferida" mencionada en la especificación) — con el volumen esperado de categorías, cargar el árbol completo de una vez es más simple y ya cumple el resto de la sección de rendimiento (consultas indexadas por `parentId`/`status`, caché, paginación en colecciones y en productos resueltos).

## Frontend (`apps/admin`)

- **`/categories`**: árbol indentado (no una librería de drag-and-drop) con botones ▲/▼ para reordenar hermanas y un selector de categoría padre en el editor para mover un nodo — mismo resultado funcional que "arrastrar y soltar" pidiendo menos superficie de dependencias nuevas; la API ya queda lista para conectar una librería de DnD real más adelante sin tocar el backend.
- **`/categories/new`, `/categories/[id]`**: comparten `CategoryForm`. El selector de padre excluye la propia categoría y sus descendientes (`collectSubtreeIds`) para no ofrecer siquiera una jerarquía inválida en la UI, aunque el backend igual la rechazaría.
- **`/collections`**: listado con búsqueda, filtros de estado/tipo y paginación.
- **`/collections/new`**: datos básicos + selector de tipo; si es `SMART` se muestra el mismo `RuleBuilder` que en edición.
- **`/collections/[id]`**: para `MANUAL` muestra buscador de productos + lista reordenable (▲/▼) + quitar; para `SMART` muestra el constructor de reglas y, debajo, la lista de productos que las cumplen en este momento — es una vista en vivo, no hay botón "sincronizar".

## Alcance diferido

Fuera de este sprint, tal como delimita la especificación: atributos y filtros avanzados (008), y las páginas públicas de navegación por categoría/colección en el storefront (013/014) — este sprint solo entrega las APIs públicas que esas páginas van a consumir.
