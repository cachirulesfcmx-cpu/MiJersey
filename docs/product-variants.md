# Variantes de producto

Implementación de [`docs/prompts/007-Product-Variants.md`](prompts/007-Product-Variants.md). A diferencia de Taxonomy (006), que es un dominio propio con su propio puerto de lectura, las opciones y variantes son parte estructural del agregado `Product`: viven dentro de `apps/api/src/modules/catalog` (mismo módulo de 005), sin un nuevo bounded context.

## Modelo de dominio

- **ProductOption**: `id`, `productId`, `name`, `position`, `values: ProductOptionValue[]`. Único por `(productId, name)`.
- **ProductOptionValue**: `id`, `optionId`, `value`, `position`. Único por `(optionId, value)`.
- **ProductVariant**: `id`, `productId`, `sku`, `slug`, `title`, `price`, `compareAtPrice`, `weight`, `barcode`, `imageId`, `status` (`ACTIVE` | `ARCHIVED`), `optionValueIds: string[]`.
- **ProductVariantOptionValue**: tabla puente `(variantId, optionValueId)`.

**Combinación única por producto**: cada variante guarda `combinationKey`, una cadena normalizada (`optionValueIds` ordenados y unidos) con una restricción `@@unique([productId, combinationKey])` en la base de datos. Se prefirió esto sobre unicidad basada en arrays/GIN por ser una solución simple y portable con Prisma/Postgres estándar.

**Producto sin opciones**: 005 no define un campo de precio en `Product` — el precio vive en la variante. Un producto sin opciones puede tener exactamente una variante ("por defecto"): `GenerateVariantsUseCase` la crea con `combinations = [[]]` cuando `productOptions.length === 0`. No hay creación automática de esa variante al crear el producto — es una decisión explícita del administrador vía "Generar variantes".

## Generador de combinaciones

`GenerateVariantsUseCase` calcula el producto cartesiano de los valores de cada opción (`cartesianProduct`, en `variant-combination.util.ts`) y es idempotente: antes de crear, lee `existingCombinationKeys(productId)` y descarta las combinaciones ya existentes (`{ created, skippedExisting }` en la respuesta). Dentro del mismo lote reserva las claves ya generadas en memoria para no crear duplicados entre sí.

SKU y slug se derivan de los valores de opción (`toSkuToken()`: normaliza a mayúsculas sin acentos/símbolos, con fallback `V${index}` si el valor no produce ningún carácter válido) y se resuelven colisiones contra SKUs/slugs existentes añadiendo un sufijo numérico.

`ProductVariantRepositoryPort.createMany` se implementa como una transacción de `create` individuales (`prisma-product-variant.repository.ts`) porque `createMany` de Prisma no admite escrituras anidadas de relaciones (las filas de `product_variant_option_values`).

## Endpoints

| Método | Ruta                                           | Permiso          | Descripción                                                |
| ------ | ---------------------------------------------- | ---------------- | ---------------------------------------------------------- |
| GET    | `/admin/products/:productId/options`           | `admin:access`   | Lista opciones del producto (con sus valores)              |
| POST   | `/admin/products/:productId/options`           | `catalog:manage` | Crea una opción con sus valores iniciales                  |
| PATCH  | `/admin/options/:id`                           | `catalog:manage` | Renombra y/o reemplaza los valores (agrega/quita/reordena) |
| DELETE | `/admin/options/:id`                           | `catalog:manage` | Elimina (bloqueado si el producto tiene variantes)         |
| GET    | `/admin/products/:productId/variants`          | `admin:access`   | Lista paginada, filtrable por `status`                     |
| POST   | `/admin/products/:productId/variants`          | `catalog:manage` | Crea una variante manualmente                              |
| POST   | `/admin/products/:productId/variants/generate` | `catalog:manage` | Genera el producto cartesiano de las opciones actuales     |
| GET    | `/admin/variants/:id`                          | `admin:access`   | Detalle                                                    |
| PATCH  | `/admin/variants/:id`                          | `catalog:manage` | Edición (sku, slug, precio, estado, etc.)                  |
| PATCH  | `/admin/variants/bulk`                         | `catalog:manage` | Actualiza `status`/`price`/`compareAtPrice` de varios ids  |
| DELETE | `/admin/variants/:id`                          | `catalog:manage` | Elimina                                                    |
| GET    | `/products/:slug/variants`                     | Público          | Variantes `ACTIVE` de un producto `ACTIVE` + `PUBLIC`      |

`PATCH /admin/variants/bulk` se declara antes que `PATCH /admin/variants/:id` en la clase del controlador para que Express no confunda `bulk` con un id (mismo caso que 005 y 006 con `bulk/delete` y `reorder`).

## Reglas y errores mapeados (`CatalogExceptionFilter`)

| Error                              | HTTP | Motivo                                                                     |
| ---------------------------------- | ---- | -------------------------------------------------------------------------- |
| `ProductOptionNotFoundError`       | 404  | —                                                                          |
| `DuplicateOptionNameError`         | 409  | Ya existe una opción con ese nombre en el producto                         |
| `DuplicateOptionValueError`        | 409  | Valor repetido dentro de la misma opción                                   |
| `OptionValueInUseError`            | 409  | El valor está referenciado por al menos una variante                       |
| `ProductHasVariantsError`          | 409  | No se puede crear/renombrar/eliminar una opción con variantes ya generadas |
| `ProductVariantNotFoundError`      | 404  | —                                                                          |
| `VariantSkuAlreadyExistsError`     | 409  | —                                                                          |
| `VariantSlugAlreadyExistsError`    | 409  | —                                                                          |
| `DuplicateVariantCombinationError` | 409  | Ya existe una variante con esa combinación de valores                      |
| `InvalidVariantOptionValuesError`  | 400  | `optionValueIds` no cubre exactamente las opciones del producto            |

Un lote de curl en vivo contra Railway detectó que estos 9 errores nuevos no estaban registrados en `STATUS_BY_ERROR` del filtro (caían al 400 por defecto); se corrigió y se re-verificó cada código antes de continuar — exactamente el tipo de bug que las pruebas unitarias (que mockean los puertos) no detectan, porque nunca ejercitan el wiring real de NestJS.

## Auditoría

Namespace `catalog.variant.*` y `catalog.option.*`, escritos vía el mismo `AuditLogRepositoryPort` de Identity (004): `created`, `updated`, `sku_changed` y `price_changed` (estos dos últimos se emiten además del genérico `updated` cuando aplica), `generated` (con `{ created, skippedExisting }`), `bulk_updated`, `deleted`.

## Permisos

Reutiliza `catalog:manage` (creado en 005) — opciones y variantes son, a efectos de RBAC, la misma superficie de "gestión del catálogo" que categorías/colecciones en 006.

## Frontend (`apps/admin`)

Todo vive dentro de `/products/[id]` (no son rutas nuevas), como dos secciones debajo del formulario de datos básicos del producto:

- **`OptionsEditor`**: lista de opciones con sus valores en un campo de texto separado por comas (editar y guardar reemplaza la lista completa vía `PATCH /admin/options/:id`); alta de opciones nuevas; eliminar con confirmación.
- **`VariantsManager`**: control "Generar variantes" (precio base opcional); tabla con selección múltiple, precio editable en línea (auto-guarda al perder el foco), estado con toggle de un clic, eliminar por fila, y una barra de acciones en lote (publicar/archivar) para las filas seleccionadas — mismo patrón de UX que la barra de acciones en lote de `/products` (005). La columna "Combinación" resuelve los `optionValueIds` de cada variante a texto legible (`Talla: M, Color: Rojo`) cruzándolos contra las opciones del producto.

Guardar los datos básicos del producto ya no redirige a `/products`: el formulario se queda en la misma página para que el administrador pueda seguir gestionando opciones y variantes sin perder el contexto.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): producto → opciones Talla (S/M/L) y Color (Rojo/Azul) → generación de 6 variantes con SKU/slug derivados → re-generación idempotente (`{created: 0, skippedExisting: 6}`) → creación manual con combinación duplicada rechazada (409) → eliminación de opción bloqueada mientras existen variantes (409, mensaje visible en la UI) → edición de precio y SKU con las tres entradas de auditoría correspondientes → archivado individual y en lote → eliminación de una variante → endpoint público `/products/:slug/variants` excluyendo variantes archivadas. Todos los datos de prueba se eliminaron de Railway al finalizar.

## Alcance diferido

Atributos reutilizables entre productos y filtros de navegación (buscador facetado) quedan para 008, tal como delimita la especificación — este sprint solo cubre opciones/variantes propias de cada producto.
