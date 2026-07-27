# Atributos y filtros

Implementación de [`docs/prompts/008-Attributes-Filters.md`](prompts/008-Attributes-Filters.md). A diferencia de las opciones/variantes (007), los atributos son **globales y reutilizables entre productos** — la misma naturaleza que Categorías/Colecciones (006) — por lo que viven en su **propio módulo** (`apps/api/src/modules/attributes`), no dentro de Catalog.

## Modelo de dominio

- **Attribute**: `id`, `code` (único, normalizado tipo `screen_size`), `name`, `type` (`TEXT` | `NUMBER` | `BOOLEAN` | `DATE` | `LIST` | `COLOR` | `MEASUREMENT`), `isFilterable`, `isComparable`, `isRequired`, `sortOrder`, `status` (`ACTIVE` | `ARCHIVED`), `values: AttributeValue[]`.
- **AttributeValue**: `id`, `attributeId`, `value` (código corto, p. ej. `red`), `label` (texto mostrado, p. ej. `Rojo`), `sortOrder`. Solo tiene sentido para atributos `LIST`/`COLOR`.
- **ProductAttribute**: la asignación producto↔atributo — `productId`, `attributeId`, `valueId` (para `LIST`/`COLOR`) **o** `customValue` (texto libre, para el resto de tipos), nunca ambos. Único por `(productId, attributeId)`: este sprint modela un solo valor por atributo y producto — el modelo mínimo del spec (`productId, attributeId, valueId?, customValue?`) no exige ni sugiere múltiples valores por atributo, así que no se inventó esa capacidad.

**Eliminación lógica**: `Attribute.deletedAt` (mismo patrón que `Product.deletedAt` en 005) — `DELETE /admin/attributes/:id` nunca borra la fila; el atributo deja de listarse/filtrarse pero las asignaciones existentes en `product_attributes` se mantienen intactas, evitando que "cambios no rompan productos existentes" (regla de negocio del spec §5).

**Cambio de tipo**: bloqueado con `AttributeInUseError` (409) si el atributo ya tiene alguna fila en `product_attributes` — cambiar de `LIST` a `TEXT` (o viceversa) invalidaría los datos ya asignados.

## Por qué Attributes no depende del dominio de Catalog

`ProductQueryPort` (implementado en `PrismaProductQueryRepository`) lee `products`/`product_attributes` vía Prisma directo — mismo patrón CQRS que Taxonomy en 006 — sin importar `CatalogModule` ni sus entidades. La única excepción a "el módulo nuevo nunca es importado por Catalog" es deliberada: el endpoint público `GET /products/search` debe vivir dentro del `PublicProductsController` que ya es dueño de `/products` (para no repetir el problema de orden de rutas ya documentado en 005/006/007 — un controlador nuevo bajo `/products` con un `@Get('search')` competiría con el `@Get(':slug')` existente de forma frágil, dependiente del orden de import de módulos). En vez de eso, `CatalogModule` importa `AttributesModule` y usa su `SearchProductsUseCase` exportado; `search` se declara antes que `:slug` en el mismo controlador, igual que los demás casos de "literal antes que dinámico" de sprints previos.

## Motor de filtros (facetas)

`GetFiltersUseCase` → `ProductQueryPort.computeFacets(filters)`: para cada atributo `ACTIVE` + `isFilterable`, calcula conteos de productos `ACTIVE`+`PUBLIC` que coinciden, agrupando por `valueId` (atributos `LIST`/`COLOR`) o por `customValue` (el resto) vía `groupBy` de Prisma. Al calcular las facetas de un atributo se excluyen los filtros ya aplicados sobre ese MISMO atributo (para que el usuario pueda seguir viendo/cambiando su propia selección), pero se incluyen los de otros atributos — combinación estándar de búsqueda facetada: **OR** entre valores del mismo atributo, **AND** entre atributos distintos.

El parámetro `filters` (usado por `GET /filters` y `GET /products/search`) es un JSON codificado en la query string: `[{"attributeId":"...","valueIds":["..."]}, {"attributeId":"...","customValues":["..."]}]` — se optó por JSON en vez de un esquema de query params anidados porque es más simple de validar/parsear en el backend; el mapeo entre la URL legible del storefront (013/014/016) y este formato es responsabilidad del frontend consumidor.

## Caché (rendimiento)

`AttributeCacheService` cachea únicamente la consulta de facetas **sin ningún filtro aplicado** (TTL 60 s, mismo criterio conservador que `TaxonomyCacheService` en 006) — cualquier combinación de filtros no pasa por caché. Se invalida en cualquier creación/edición/eliminación de atributo relevante para filtros y en cualquier asignación/desasignación a un producto.

## Endpoints

| Método | Ruta                                                 | Permiso          | Descripción                                                         |
| ------ | ---------------------------------------------------- | ---------------- | ------------------------------------------------------------------- |
| GET    | `/admin/attributes`                                  | `admin:access`   | Lista paginada, con búsqueda y filtros por estado/tipo/filtrable    |
| GET    | `/admin/attributes/:id`                              | `admin:access`   | Detalle (con sus valores)                                           |
| POST   | `/admin/attributes`                                  | `catalog:manage` | Alta (con valores iniciales si aplica)                              |
| PATCH  | `/admin/attributes/:id`                              | `catalog:manage` | Edición; puede reemplazar la lista de valores                       |
| DELETE | `/admin/attributes/:id`                              | `catalog:manage` | Eliminación lógica                                                  |
| GET    | `/admin/products/:productId/attributes`              | `admin:access`   | Atributos asignados a un producto (con `valueLabel` ya resuelto)    |
| POST   | `/admin/products/:productId/attributes`              | `catalog:manage` | Asigna/actualiza un atributo (upsert)                               |
| PATCH  | `/admin/products/:productId/attributes/bulk`         | `catalog:manage` | Reemplaza todas las asignaciones del producto en una sola operación |
| DELETE | `/admin/products/:productId/attributes/:attributeId` | `catalog:manage` | Quita un atributo del producto                                      |
| GET    | `/filters`                                           | Público          | Facetas (atributos filtrables + conteos)                            |
| GET    | `/products/search`                                   | Público          | Búsqueda de productos con filtros de atributo + paginación + orden  |

## "Acciones masivas"

El spec (§7) pide "acciones masivas" en el frontend administrativo. Se interpretó como el reemplazo en lote de **todos los atributos de un producto en una sola operación** (`PATCH .../attributes/bulk`) — coherente con el orden del propio spec, que lista "asignación a productos" justo antes de "acciones masivas" en la misma oración. No se agregó una acción de archivado/eliminación masiva sobre el _listado_ de atributos: el spec no lo pide con suficiente especificidad como para inventar semántica adicional (a diferencia de 005, donde "acciones masivas" sobre productos sí estaba explícito en los endpoints mínimos).

## Errores mapeados (`AttributeExceptionFilter`)

| Error                             | HTTP | Motivo                                                            |
| --------------------------------- | ---- | ----------------------------------------------------------------- |
| `AttributeNotFoundError`          | 404  | —                                                                 |
| `AttributeCodeAlreadyExistsError` | 409  | —                                                                 |
| `AttributeInUseError`             | 409  | Cambio de tipo bloqueado por asignaciones existentes              |
| `AttributeValueNotFoundError`     | 404  | —                                                                 |
| `DuplicateAttributeValueError`    | 409  | Valor repetido dentro del mismo atributo                          |
| `AttributeValueInUseError`        | 409  | No se puede quitar un valor asignado a productos                  |
| `InvalidAttributeAssignmentError` | 400  | Falta `valueId` (tipos `LIST`/`COLOR`) o `customValue` (el resto) |
| `ProductNotFoundError`            | 404  | —                                                                 |
| `InvalidFilterQueryError`         | 400  | El parámetro `filters` no es JSON válido o tiene forma inválida   |

Un bug real se detectó en la verificación en vivo contra Railway: `PublicFiltersController` no tenía el decorador `@Public()`, así que `GET /filters` exigía un JWT igual que cualquier ruta admin — se corrigió antes de continuar. Este es exactamente el tipo de error que las pruebas unitarias (que no montan el guard global) no detectan.

## `isRequired` (obligatoriedad)

Se guarda y se muestra en el editor de atributos del producto (marca visual `*`), pero **no bloquea** la creación/edición de un producto en Catalog si falta un atributo obligatorio — hacerlo requeriría que `CatalogModule` dependiera de `AttributesModule` para cada escritura de producto, un acoplamiento mucho más pesado que lo que el spec mínimo pide. Queda como validación de UI únicamente en este sprint.

## Permisos

Reutiliza `catalog:manage` (creado en 005) — misma superficie de "gestión del catálogo" que Categorías/Colecciones/Variantes.

## Frontend (`apps/admin`)

- **`/attributes`**: listado con búsqueda, filtros (estado/tipo), paginación.
- **`/attributes/new`, `/attributes/[id]`**: comparten `AttributeForm` — código (inmutable al editar), nombre, tipo (inmutable al editar, ya que cambiarlo pasa por el caso de uso con su propia validación), casillas `isFilterable`/`isComparable`/`isRequired`, estado (solo edición), y un editor de valores (fila `valor` + `etiqueta` con ▲/▼ para reordenar y eliminar) que solo se muestra para tipos `LIST`/`COLOR`.
- **`AttributesEditor`** (dentro de `/products/[id]`, junto a `OptionsEditor`/`VariantsManager` de 007): tabla de atributos asignados (editor de valor inline: `<select>` para `LIST`/`COLOR`, texto libre para el resto) con alta/baja en un borrador local y un único botón "Guardar cambios" que llama a `bulkAssignProductAttributes` — la interacción de "acciones masivas" descrita arriba, deliberadamente distinta del autoguardado por fila usado en `OptionsEditor`/`VariantsManager`.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): atributo `Color` (`LIST`, filtrable, valores rojo/azul) y `Material` (`TEXT`, filtrable) → producto de prueba con ambos asignados → rechazo de `valueId` inválido (400) → bloqueo de cambio de tipo con asignaciones (409) → bloqueo de eliminar un valor en uso (409) → publicación del producto → `GET /filters` con conteos reales → `GET /products/search` filtrado por valor de faceta (con y sin coincidencias) → reemplazo en lote de asignaciones → eliminación de una asignación → eliminación lógica de un atributo (desaparece de listados/facetas) → verificación del rastro de auditoría completo. Repetido en la interfaz de `apps/admin`: alta de atributo `Género` (`LIST`) con su valor vía el editor, edición confirmando persistencia, y asignación + guardado en lote desde `AttributesEditor` en la página de producto. Todos los datos de prueba se eliminaron de Railway al finalizar.

## Alcance diferido

Comparación de productos lado a lado (el flag `isComparable` se guarda pero no tiene una UI/endpoint dedicado), y las páginas públicas de listado/filtrado del storefront (014/016) — este sprint solo entrega las APIs públicas (`/filters`, `/products/search`) que esas páginas consumirán, sin requerir cambios estructurales según delimita la especificación.
