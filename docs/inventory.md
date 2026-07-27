# Inventario

Implementación de [`docs/prompts/009-Inventory.md`](prompts/009-Inventory.md). Vive en su propio módulo (`apps/api/src/modules/inventory`), igual que Attributes (008): `Warehouse`/`InventoryItem`/`InventoryMovement` son entidades propias que referencian `ProductVariant` (007) mediante su propio `VariantQueryPort` de solo lectura, sin importar `CatalogModule`.

## Modelo de dominio

- **Warehouse**: `id`, `code` (único), `name`, `status` (`ACTIVE` | `ARCHIVED`). Un almacén archivado deja de admitir nuevos movimientos, pero el inventario que ya tiene no se toca (mismo espíritu que el archivado de Attribute en 008).
- **InventoryItem**: uno por `(variantId, warehouseId)` — `availableQuantity`, `reservedQuantity`, `incomingQuantity`, `safetyStock`, y `version` (bloqueo optimista, ver más abajo). Se crea de forma perezosa (`findOrCreate`) la primera vez que se ajusta esa combinación; no hace falta un paso previo de "alta de inventario".
- **InventoryMovement**: inmutable — nunca se edita ni se borra (spec §4/§10). Guarda `type`, `quantity`, `reason`, `referenceType`/`referenceId` (referencia genérica a quien originó el movimiento — un carrito, un pedido, etc.) y `createdBy`.

## Contabilidad de cantidades

`availableQuantity` y `reservedQuantity` son las dos mitades del stock físico en el almacén (`disponible + reservado = existencia física`); `incomingQuantity` es stock en tránsito, contable aparte. Cada tipo de movimiento mueve las cantidades así:

| Movimiento                | Efecto                                            | Origen                                    |
| ------------------------- | ------------------------------------------------- | ----------------------------------------- |
| `INBOUND`                 | `available += cantidad`                           | Ajuste manual                             |
| `OUTBOUND` (manual)       | `available -= cantidad`                           | Ajuste manual (salida sin reserva previa) |
| `OUTBOUND` (confirmación) | `reserved -= cantidad` (available **no** se toca) | `POST /admin/inventory/confirm`           |
| `RESERVATION`             | `available -= cantidad`, `reserved += cantidad`   | `POST /admin/inventory/reserve`           |
| `RELEASE`                 | `reserved -= cantidad`, `available += cantidad`   | `POST /admin/inventory/release`           |
| `ADJUSTMENT_POSITIVE`     | `available += cantidad`                           | Ajuste manual                             |
| `ADJUSTMENT_NEGATIVE`     | `available -= cantidad`                           | Ajuste manual                             |
| `RETURN`                  | `available += cantidad`                           | Ajuste manual                             |

La distinción entre las dos variantes de `OUTBOUND` es intencional: cuando una reserva se **confirma** (spec §5, "confirmaciones de pedido convertirán reservas en salidas"), el stock ya se había descontado de `available` al reservar — solo hace falta liberar la reserva sin volver a tocar `available`. Un `OUTBOUND` manual, en cambio, nunca pasó por una reserva, así que descuenta directo de `available`.

## Bloqueo optimista y transacciones (spec §9)

`InventoryItem.version` se incrementa en cada escritura. Toda mutación (`applyMovement` en `InventoryItemRepositoryPort`) hace, dentro de una sola transacción de Prisma:

1. `UPDATE ... WHERE id = ? AND version = ?` (con los deltas correspondientes) — si no coincide ninguna fila, la operación no tuvo efecto.
2. Solo si el `UPDATE` afectó una fila, se inserta el `InventoryMovement` correspondiente.

Si la versión no coincide (otra petición concurrente ya escribió), el caso de uso reintenta hasta `MAX_CONCURRENCY_RETRIES` veces (releyendo el ítem en cada intento), y si se agotan los reintentos devuelve `InventoryConcurrencyError` (409) para que el cliente decida si reintentar. Las validaciones de negocio (stock insuficiente, etc.) se evalúan en cada intento contra el estado recién leído, así que nunca quedan "colgadas" en un dato obsoleto.

## Reglas de negocio

- **Nunca stock negativo, salvo configuración explícita** (spec §5): reservar/liberar/confirmar siempre bloquean si dejarían un valor negativo. El ajuste manual acepta `allowNegative: true` para los casos excepcionales (mermas, correcciones) donde el spec permite la excepción explícita.
- **Reservar reduce disponible** y **liberar lo devuelve** — ambos validados contra el estado real del ítem, nunca contra un valor supuesto por el cliente.
- **Movimientos inmutables**: no existe ningún endpoint de edición o borrado de `InventoryMovement`.

## Endpoints

| Método | Ruta                            | Permiso          | Descripción                                                               |
| ------ | ------------------------------- | ---------------- | ------------------------------------------------------------------------- |
| GET    | `/admin/warehouses`             | `admin:access`   | Lista paginada, con búsqueda y filtro por estado                          |
| GET    | `/admin/warehouses/:id`         | `admin:access`   | Detalle                                                                   |
| POST   | `/admin/warehouses`             | `catalog:manage` | Alta                                                                      |
| PATCH  | `/admin/warehouses/:id`         | `catalog:manage` | Edición (nombre, estado)                                                  |
| GET    | `/admin/inventory`              | `admin:access`   | Lista paginada; filtros por búsqueda (SKU/producto), almacén, bajo umbral |
| GET    | `/admin/inventory/movements`    | `admin:access`   | Historial de movimientos, filtrable por variante/almacén/tipo/referencia  |
| GET    | `/admin/inventory/:variantId`   | `admin:access`   | Inventario de una variante en todos los almacenes                         |
| POST   | `/admin/inventory/adjust`       | `catalog:manage` | Entrada/salida manual/ajuste ± /devolución                                |
| POST   | `/admin/inventory/reserve`      | `catalog:manage` | Reserva stock (`referenceType`/`referenceId` genéricos)                   |
| POST   | `/admin/inventory/release`      | `catalog:manage` | Libera una reserva previa                                                 |
| POST   | `/admin/inventory/confirm`      | `catalog:manage` | Confirma una reserva como salida definitiva                               |
| PATCH  | `/admin/inventory/safety-stock` | `catalog:manage` | Fija el umbral de alerta de un ítem                                       |

`GET /admin/inventory/movements` se declara antes que `GET /admin/inventory/:variantId` en el controlador para que Express no confunda `movements` con un id (mismo caso que 005/006/007/008).

`POST /admin/inventory/confirm` y `PATCH /admin/inventory/safety-stock` no están en la lista "mínima" del spec (§8), pero son necesarios para cumplir reglas de negocio explícitas del propio documento (§5, confirmaciones de pedido) y el campo `safetyStock` del modelo mínimo (§3) — se agregaron como primitivas genéricas (`referenceType`/`referenceId`) para que 017-Cart/018-Checkout/021-Orders las reutilicen sin cambios estructurales, tal como pide la Definition of Done.

## Errores mapeados (`InventoryExceptionFilter`)

| Error                             | HTTP | Motivo                                                                           |
| --------------------------------- | ---- | -------------------------------------------------------------------------------- |
| `WarehouseNotFoundError`          | 404  | —                                                                                |
| `WarehouseCodeAlreadyExistsError` | 409  | —                                                                                |
| `WarehouseNotActiveError`         | 409  | El almacén está archivado                                                        |
| `VariantNotFoundError`            | 404  | —                                                                                |
| `InventoryItemNotFoundError`      | 404  | No existe inventario para esa variante/almacén (reserva/liberación/confirmación) |
| `InsufficientStockError`          | 409  | Stock disponible insuficiente                                                    |
| `InvalidReleaseQuantityError`     | 409  | Se intenta liberar/confirmar más de lo reservado                                 |
| `InvalidMovementTypeError`        | 400  | Tipo de movimiento no permitido en un ajuste manual (p. ej. `RESERVATION`)       |
| `InventoryConcurrencyError`       | 409  | Conflicto de bloqueo optimista tras agotar los reintentos                        |

## Auditoría

Namespace `inventory.warehouse.*` e `inventory.item.*`/`inventory.stock.*`, además del ledger propio (`InventoryMovement`, nunca editable/borrable). Cada movimiento de stock genera tanto una fila de auditoría genérica (para el feed de actividad del dashboard) como su registro detallado en `inventory_movements`.

## Permisos

Reutiliza `catalog:manage` (creado en 005) — inventario es, a efectos de RBAC, otra faceta de "gestión del catálogo".

## Frontend (`apps/admin`)

- **`/warehouses`**: listado con búsqueda/filtro de estado + CRUD (`WarehouseForm` compartido; el código es inmutable al editar).
- **`/inventory`**: formulario "Ajustar inventario" (buscador de producto → selector de variante → almacén → tipo → cantidad → motivo → `allowNegative`) más una tabla filtrable (búsqueda, almacén, "bajo el umbral") con el umbral de seguridad editable inline (autoguardado al perder el foco) y un enlace a los movimientos de cada fila.
- **`/inventory/movements`**: historial paginado y filtrable por tipo; acepta `variantId`/`warehouseId` en la query string (así "Movimientos" desde `/inventory` llega ya filtrado).

Reservar/liberar/confirmar no tienen UI propia en este sprint: son primitivas pensadas para que 017/018/021 las invoquen programáticamente, no para operación manual del admin — no se inventó una pantalla para una acción que, en la práctica, no tiene todavía quién la dispare manualmente con sentido (no hay carritos ni pedidos aún).

## Verificación en vivo

Contra Railway (Postgres + Redis reales): almacén de prueba → producto con una variante por defecto (007) → entrada de 100 unidades (crea el `InventoryItem` de forma perezosa) → reserva de 30 (bloqueada al pedir de más) → liberación parcial (bloqueada al pedir de más) → confirmación del resto como salida (verificando que `available` no se vuelve a tocar) → umbral de seguridad y bandera `isBelowSafetyStock` → tipo de movimiento inválido en ajuste manual (400) → ajuste negativo bloqueado y luego permitido con `allowNegative` → almacén archivado bloqueando nuevos movimientos (409) → listado de movimientos y de inventario con filtros → auditoría completa. Repetido en la interfaz de `apps/admin`: alta/archivado de almacén, búsqueda de producto → variante en el formulario de ajuste, aplicación de un ajuste con recarga de la tabla, y navegación a `/inventory/movements` con los filtros de la URL. Todos los datos de prueba se eliminaron de Railway al finalizar.

## Alcance diferido

Múltiples almacenes por producto ya está soportado en el modelo (`InventoryItem` es por `variantId` + `warehouseId`), pero no hay todavía una vista que compare stock entre almacenes lado a lado, ni lógica de reabastecimiento automático entre ellos — el spec solo pide "soportar múltiples almacenes en el futuro" (§1), no resolver la logística de transferencias entre ellos en este sprint. Tampoco se integra con Pedidos/Carrito/Envíos (017/018/021/023) — eso es explícitamente el trabajo de sprints futuros según la Definition of Done, que este módulo ya deja preparado vía `reserve`/`release`/`confirm` con referencias genéricas.
