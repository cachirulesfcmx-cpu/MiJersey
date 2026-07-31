# Orders

Implementación de [`docs/prompts/021-Orders.md`](prompts/021-Orders.md). Módulo nuevo (`apps/api/src/modules/orders`) que se vuelve el dueño definitivo del ciclo de vida de `Order`/`OrderItem` — tablas que 018-Checkout creó como modelo mínimo, anticipando exactamente este momento.

## Órdenes ya existían: aquí llega su ciclo de vida completo

018-Checkout documentó explícitamente en `schema.prisma` que `Order`/`OrderItem` eran "modelo mínimo de 021-Orders, creado ahora porque el criterio de aceptación de 018-Checkout exige 'generar una orden lista para pago'" y que "el ciclo de vida completo... es responsabilidad de 021". Este módulo no vuelve a crear esas tablas — construye encima de ellas, mismo patrón CQRS de solo-lectura-propia que ya usaba Customer Account (019) para `/me/orders`.

**`ConfirmCheckoutUseCase` (018) no se tocó.** Sigue creando la orden exactamente igual que antes, a través de su propio `OrderRepositoryPort`. Orders (021) construye su propio `OrderRepositoryPort` sobre las mismas tablas físicas — ni lo importa ni lo reemplaza. Es el mismo criterio de "no cambios estructurales" que la Definition of Done de 021 exige respecto a Checkout.

**Sí se agregó `cancelledAt`/`cancelReason`** a `Order` (columnas nuevas, nullable, sin default) y se propagaron de forma aditiva a la entidad y el repositorio de Checkout — un cambio de tres líneas sin alterar ningún comportamiento existente, necesario para que el tipo `Order` del SDK sea el mismo en toda la aplicación (respuesta de `POST /checkout/confirm` y de `GET /orders/:id`).

## `/orders` no reemplaza `/me/orders`

019-Customer-Account ya expone `GET /me/orders`/`GET /me/orders/:id` con su propia lectura de solo consulta, documentando explícitamente: "el ciclo de vida completo (cancelar, reembolsar, timeline) es responsabilidad de 021-Orders" — anticipando este módulo sin necesitar cambios cuando llegara. Por eso **019 no se tocó**: sigue funcionando igual, y la sección "Pedidos" de `/account` lo sigue usando para el listado.

`/orders` (021) es una superficie nueva y más completa: mismo concepto ("mis pedidos"), pero con línea de tiempo, cancelación y reordenar — capacidades que 019 nunca tuvo. En el storefront, `/account/orders/[id]` migró a consumir `/orders/:id` (021) en vez de `/me/orders/:id` (019) precisamente porque necesita esas capacidades nuevas; la lista en `/account` sigue en 019 porque no necesita nada más de lo que ya hace.

## Máquina de estados: solo la transición de cancelación

La spec pide "cada transición deberá validarse mediante reglas de negocio" (§4) y "validación de estados" (§9). Se implementó la única transición que este módulo activamente dispara — `canCancelOrder()` (función pura, `domain/value-objects/order-transitions.util.ts`): un pedido es cancelable mientras no esté ya `CANCELLED`/`REFUNDED` y mientras su envío no haya salido (`fulfillmentStatus` distinto de `SHIPPED`/`DELIVERED`). Intentar cancelar fuera de esa ventana devuelve `409 ORDER_NOT_CANCELLABLE`.

Las demás transiciones (pago capturado, envío despachado) no tienen disparador propio en 021 — pertenecen a 022-Payments y 023-Shipping, que no existen todavía. Para que esos módulos no requieran cambios estructurales en Orders cuando lleguen, se dejó `UpdateOrderStatusUseCase` (genérico, actualiza `paymentStatus`/`fulfillmentStatus`, registra línea de tiempo + auditoría) exportado desde `OrdersModule` sin ningún consumidor todavía — mismo patrón de "exportar para que el módulo hermano lo reutilice" que Cart aplicó con `AddCartItemUseCase`.

**Sin reembolsos ni devoluciones reales**: la spec los marca "preparado para integración" (§2). Cancelar un pedido ya pagado deja constancia en la línea de tiempo, pero no dispara ningún reembolso — no hay a dónde dispararlo hasta que exista 022-Payments.

## Línea de tiempo sin tocar a Checkout

`OrderStatusHistory` (nueva tabla, `field`/`value`/`note`/`createdAt`) es deliberadamente genérica: cualquier módulo que en el futuro cambie `status`/`paymentStatus`/`fulfillmentStatus` puede escribir ahí sin cambios de esquema. El primer evento de toda línea de tiempo ("Pedido confirmado") **no es una fila física** — `GetOrderTimelineUseCase` lo deriva de `Order.createdAt` al construir la vista, evitando que `ConfirmCheckoutUseCase` (018) tuviera que escribir en una tabla de un módulo que no existía cuando se implementó.

## `POST /orders`: por qué no existe

La spec lista `POST /orders` entre los endpoints mínimos (§7), pero no se implementó como una ruta pública de creación de pedidos. La única vía legítima para que un cliente genere un pedido es `POST /checkout/confirm` (018), que revalida precio y stock de forma autoritativa de forma atómica con el consumo del carrito — exponer una ruta paralela de creación habría significado un bypass de esa revalidación, un hueco de seguridad/inventario real. Se documenta como una desviación deliberada de la lista literal de endpoints, mismo criterio que otras decisiones de esta sesión (p. ej. "una sesión de checkout activa por carrito" resuelto a nivel de aplicación, no de base de datos).

## Reorder: de orquestación de frontend a endpoint real

019 había implementado "Volver a comprar" como orquestación pura de frontend (un `useCart().addItem()` por línea, documentado explícitamente como temporal "hasta que 021 exista"). `ReorderUseCase` es ahora la implementación real: reutiliza `GetOrCreateCartUseCase`/`AddCartItemUseCase` de Cart (017) tal cual — ninguna validación de stock/disponibilidad se reimplementa — y reporta cuántas líneas se agregaron y cuántas fallaron (variante descontinuada o sin stock), igual que hacía la versión de frontend que reemplaza. El frontend (`/account/orders/[id]`) se actualizó para llamar a este endpoint en vez de iterar manualmente.

## Propiedad, no permiso

`GetOrderUseCase` compara `order.customerId` contra el cliente autenticado; un pedido ajeno se reporta como `404 ORDER_NOT_FOUND`, nunca `403` — no revela que el recurso existe, mismo criterio que direcciones/pedidos ajenos en 019 y items de wishlist ajenos en 020. `CancelOrderUseCase` y `GetOrderTimelineUseCase` heredan la misma comprobación.

## Orders Dashboard: solo lectura

El componente de frontend "Orders Dashboard" (spec §6) se implementó como `GET /admin/orders` de solo lectura, con paginación y filtro por `status`, gated por `admin:access` (sin permiso dedicado — mismo criterio que los métodos de envío de 018). No hay edición manual de estado desde administración: la spec de 021 no la pide, y esa capacidad naturalmente pertenece a 022-Payments/023-Shipping cuando confirmen pagos/envíos reales.

## Endpoints

| Método | Ruta                   | Auth           | Descripción                                                          |
| ------ | ---------------------- | -------------- | -------------------------------------------------------------------- |
| GET    | `/orders`              | JWT            | Lista paginada de pedidos propios                                    |
| GET    | `/orders/:id`          | JWT            | Detalle de un pedido propio (404 si es de otro cliente)              |
| GET    | `/orders/:id/timeline` | JWT            | Línea de tiempo del pedido                                           |
| POST   | `/orders/:id/cancel`   | JWT            | Cancela un pedido propio (409 si ya no es cancelable)                |
| POST   | `/orders/:id/reorder`  | JWT            | Agrega los artículos del pedido al carrito (requiere `x-session-id`) |
| GET    | `/admin/orders`        | `admin:access` | Orders Dashboard — todas las órdenes, filtro por `status`            |

`POST /orders` no existe — ver arriba.

## Auditoría

`AuditLogRepositoryPort` (Identity) registra: `order.cancelled`, `order.reordered`, y `order.status_changed` (este último sin disparador propio todavía, reservado para 022/023 vía `UpdateOrderStatusUseCase`).

## SDK

- `packages/sdk/src/orders.types.ts`: `OrderSummary`, `OrderTimelineEvent`, `CancelOrderInput`, `ReorderResult` (reexporta `Order`/`OrderItem` de `checkout.types.ts`, que ahora incluyen `cancelledAt`/`cancelReason`).
- `api-client.ts`: `listOrders`, `getOrder`, `getOrderTimeline`, `cancelOrder`, `reorder`, `listAllOrders`.

## Frontend

- **Admin**: página `/orders` (Orders Dashboard) — tabla paginada con filtro por estado.
- **Storefront**: `/account/orders/[id]` ahora consume `/orders` (021) en vez de `/me/orders` (019) para detalle; agrega `OrderTimeline` (nuevo componente) y un botón "Cancelar pedido" (visible solo cuando `canCancelOrder()` lo permite); "Comprar de nuevo" ahora llama al endpoint de reorder en vez de iterar manualmente. La lista de "Pedidos" en `/account` no cambió — sigue en 019.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): dos clientes de prueba, un administrador de prueba, producto/variante/almacén/inventario/método de envío de prueba.

**Por API (curl)**: flujo completo carrito → dirección → método de envío → `POST /checkout/confirm` genera la orden; `GET /orders` y `GET /orders/:id` la reflejan correctamente; `GET /orders/:id/timeline` muestra el evento sintético "Confirmado"; el cliente B intentando ver el pedido del cliente A recibe `404 ORDER_NOT_FOUND` (no `403`); sin token, `401`; `POST /orders/:id/reorder` agrega el artículo a un carrito nuevo (`succeededCount: 1`); `POST /orders/:id/cancel` cancela el pedido y agrega el evento correspondiente a la línea de tiempo; cancelar de nuevo devuelve `409 ORDER_NOT_CANCELLABLE`; `GET /admin/orders` (con y sin filtro `status`) devuelve las órdenes esperadas; el mismo endpoint con un token de cliente (sin `admin:access`) devuelve `403`.

**Por navegador**: `/account/orders/:id` muestra el detalle, la línea de tiempo y ambos botones; al cancelar, la página se actualiza mostrando el nuevo estado y el segundo evento de la línea de tiempo, y el botón de cancelar desaparece; en `apps/admin`, `/orders` muestra el Orders Dashboard con ambas órdenes de prueba y el filtro por estado funciona correctamente contra la API.

Toda la data de prueba (clientes, admin, producto, variante, almacén, inventario, método de envío, órdenes, carritos, sesiones de checkout, direcciones) se eliminó de Railway al finalizar.

## Alcance diferido

- **Reembolsos y devoluciones reales** — la spec los marca "preparado para integración"; dependen de 022-Payments (reembolsos) y de un futuro módulo de logística inversa.
- **Transiciones de pago/envío** — sin disparador propio en 021; `UpdateOrderStatusUseCase` queda exportado y listo para que 022-Payments/023-Shipping lo reutilicen sin cambios estructurales en Orders.
- **`POST /orders` como creación pública** — deliberadamente no implementado; ver sección dedicada arriba.
