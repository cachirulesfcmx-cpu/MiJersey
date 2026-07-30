# Customer Account

Implementación de [`docs/prompts/019-Customer-Account.md`](prompts/019-Customer-Account.md). Módulo nuevo (`apps/api/src/modules/customer`) que agrega perfil extendido, libreta de direcciones y consulta de pedidos sobre la infraestructura de identidad y sesiones ya construida en 003-Authentication-Authorization.

## Por qué no duplica lo que Identity ya tenía

Antes de escribir una sola línea se auditó qué ya existía de 003: `GET /auth/me` y `PATCH /auth/profile` (nombre/apellido), `POST /auth/change-password`, y un gestor de sesiones completo (`GET/DELETE /sessions`) — más una página `/account` en `apps/web` que ya renderizaba identidad + sesiones. La spec de 019 pide "editar perfil", "cambiar contraseña" y "administrar sesiones activas" como si fueran nuevos, pero ya estaban resueltos. Se decidió:

- **Reutilizar en vez de reimplementar**: `CustomerModule` importa `IdentityModule` y usa directamente `GetCurrentUserUseCase`/`UpdateProfileUseCase` (agregados a los `exports` de `IdentityModule`) — mismo patrón de reutilización de casos de uso de otro módulo que 018-Checkout aplicó con Cart.
- **`GET/PATCH /me` son endpoints nuevos, no un alias de `/auth/me`**: la spec pide explícitamente esas rutas, y "cuenta" (019) es un concepto más amplio que "identidad autenticada" (003) — `GET /me` compone identidad + los campos que sí son nuevos de 019 (teléfono, preferencias). `/auth/me` sigue existiendo para lo que ya usaba (login flow, verificación de email).
- **Cambio de contraseña y sesiones no se tocaron**: el frontend solo necesitaba un formulario nuevo (`ChangePasswordForm`) sobre el endpoint ya existente; la sección de sesiones de `/account` se conservó tal cual.

## `CustomerProfile`: solo los campos que `User` no tiene

La spec define `CustomerProfile` con `id, userId, firstName, lastName, phone, preferences` — pero `firstName`/`lastName` ya viven en `User` (003) y se siguen editando ahí. Duplicarlos en una tabla nueva habría creado dos fuentes de verdad para el mismo dato. `CustomerProfile` terminó con solo `phone` y `preferences` (spec §5 "la actualización del perfil no deberá afectar pedidos históricos" ya se cumple sin esfuerzo extra: `Order.contactEmail` es una foto tomada al confirmar el checkout, no una referencia viva al perfil).

Se crea de forma perezosa (`upsert` en el primer `GET /me` o `PATCH /me`), no en el registro — evita tocar el flujo de registro de 003 por un campo que puede quedar vacío indefinidamente.

`preferences` es un JSON sin esquema fijo en la spec (solo nombra el campo). Se implementó como un stand-in mínimo concreto — `{ marketingEmailsOptIn: boolean }` — en vez de un blob vacío sin forma, para que sea algo real y verificable en vez de un placeholder que nadie podría probar.

## `Address`: la libreta que 018-Checkout ya había anticipado

017/018 documentaron explícitamente que `CheckoutAddress` era una foto de captura por checkout, "distinta de la libreta de direcciones reutilizable que 019-Customer-Account definirá". Esta es esa libreta: `Address` con `customerId`, `type` (`SHIPPING`/`BILLING`), y los mismos campos postales que `CheckoutAddress`, más `isDefault`.

**"Una dirección predeterminada por tipo" (spec §5)** se aplica en el caso de uso, no con una constraint de base de datos — mismo criterio que "una sesión de checkout activa por carrito" en 018: `CreateAddressUseCase`/`UpdateAddressUseCase` buscan el default existente del mismo tipo y lo desmarcan antes de guardar el nuevo, en vez de depender de un índice único parcial (que Prisma no modela de forma portable).

**Sin integración con Checkout todavía**: no existe ningún mecanismo para copiar una dirección guardada de la libreta hacia un `CheckoutAddress` al iniciar un checkout. Ninguna spec (ni 018 ni 019) lo exige explícitamente — ambos modelos son deliberadamente independientes por ahora. Sería una mejora natural cuando el checkout necesite ofrecer "usar una dirección guardada", pero se dejó fuera para no inventar alcance no pedido.

## Pedidos: lectura propia, sin nada de 021-Orders todavía

`GET /me/orders` (paginado) y `GET /me/orders/:id` leen directamente las tablas `orders`/`order_items` (creadas por 018-Checkout) a través de un puerto de solo lectura propio (`CustomerOrderLookupPort`) — mismo patrón CQRS del resto de la sesión: en vez de importar `CheckoutModule` (que sería depender de quien hoy aloja `Order`, no de quien lo posee conceptualmente), Customer Account construye su propia lectura de las tablas físicas. Cuando 021-Orders exista y se vuelva el dueño real de esas tablas, este puerto no necesita cambiar — sigue leyendo las mismas columnas.

**Propiedad, no permiso**: `GetMyOrderUseCase` compara `order.customerId` contra el id del usuario autenticado. Un pedido ajeno se reporta como `404 ORDER_NOT_FOUND`, nunca `403` — no se revela que el recurso existe (spec §10 "autorización por propietario"). Mismo criterio aplicado a direcciones ajenas.

**"Volver a comprar" sin esperar a 021**: la spec (§3) pide esta capacidad ahora, pero el endpoint formal `POST /orders/:id/reorder` es de 021-Orders (spec, §7), que no existe. Se implementó como orquestación de frontend: el botón "Comprar de nuevo" en `/account/orders/[id]` recorre `order.items` y llama a `useCart().addItem()` (017) por cada línea, agregando lo disponible y reportando cuántos artículos no se pudieron agregar (p. ej. si una variante ya no está a la venta). Cuando 021 exista con un endpoint dedicado, este botón puede cambiar de implementación sin afectar el resto de la página.

**Descarga de comprobantes: explícitamente diferida**. La propia spec la condiciona con "cuando existan" — no hay sistema de facturas/comprobantes en el código base (eso depende de 022-Payments), así que no se construyó nada al respecto.

## Endpoints

| Método | Ruta                | Auth | Descripción                                                        |
| ------ | ------------------- | ---- | ------------------------------------------------------------------ |
| GET    | `/me`               | JWT  | Perfil de cuenta: identidad (003) + teléfono/preferencias (019)    |
| PATCH  | `/me`               | JWT  | Actualiza nombre/apellido (delegado a 003) + teléfono/preferencias |
| GET    | `/me/addresses`     | JWT  | Lista las direcciones del cliente                                  |
| POST   | `/me/addresses`     | JWT  | Crea una dirección (desmarca el default anterior del mismo tipo)   |
| PATCH  | `/me/addresses/:id` | JWT  | Edita una dirección propia (404 si es de otro cliente)             |
| DELETE | `/me/addresses/:id` | JWT  | Elimina una dirección propia                                       |
| GET    | `/me/orders`        | JWT  | Lista paginada de pedidos del cliente                              |
| GET    | `/me/orders/:id`    | JWT  | Detalle de un pedido propio (404 si es de otro cliente)            |

Todas requieren sesión (guard global `JwtAuthGuard`, sin `@Public()`) — no hay una noción de permiso aquí, solo "es tu propia cuenta".

## SDK

- `packages/sdk/src/customer.types.ts`: `MyAccount`, `UpdateMyAccountInput`, `Address`, `AddressType`, `CreateAddressInput`, `UpdateAddressInput`, `CustomerOrderSummary`, `CustomerOrderDetail`, `CustomerOrderItem`, `CustomerPreferences`.
- `api-client.ts`: `getMyAccount`, `updateMyAccount`, `listMyAddresses`, `createMyAddress`, `updateMyAddress`, `deleteMyAddress`, `listMyOrders`, `getMyOrder`.

## Frontend storefront

Se extendió `/account` (en vez de crear una ruta nueva) con secciones nuevas, manteniendo lo que ya existía (identidad + Sesiones activas):

- **`ProfileForm`**: nombre, apellido, teléfono, casilla de correos promocionales.
- **`AddressBook`**: lista de direcciones con badge de "(predeterminada)" por tipo, alta inline, "Hacer predeterminada", eliminar.
- **`OrderHistory`**: lista de pedidos (número, fecha, total, estado) enlazando a la nueva `/account/orders/[id]`.
- **`ChangePasswordForm`**: formulario nuevo sobre el endpoint ya existente de 003.
- Sesiones activas: sin cambios, reutilizada tal cual de la versión anterior de la página.

`/account/orders/[id]` (nueva): detalle del pedido + botón "Comprar de nuevo".

## Verificación en vivo

Contra Railway (Postgres + Redis reales): cliente de prueba, producto/variante/inventario/método de envío de prueba.

**Por API (curl)**: `GET /me` crea el `CustomerProfile` de forma perezosa con preferencias por default; `PATCH /me` actualiza nombre/apellido/teléfono/preferencias correctamente; crear dos direcciones `SHIPPING` marcadas como default confirma que la primera se desmarca automáticamente al crear la segunda, y que `PATCH` de la primera para volver a marcarla como default desmarca la segunda; acceder a una dirección con id inexistente devuelve `404 ADDRESS_NOT_FOUND`; `POST /auth/change-password` seguido de un login con la contraseña nueva confirma el cambio; un pedido real creado vía el flujo de checkout (018) aparece correctamente en `GET /me/orders` (resumen) y `GET /me/orders/:id` (detalle con líneas).

**Por navegador**: login en `apps/web`, `/account` muestra perfil/direcciones/pedidos/seguridad/sesiones con datos reales (incluyendo el pedido creado por curl); `/account/orders/:id` muestra el detalle correcto; el botón "Comprar de nuevo" agrega el artículo del pedido al carrito vía la API de Cart (017) y navega a `/cart`, donde aparece con el mismo producto, variante y precio del pedido original.

Toda la data de prueba (cliente, perfil, direcciones, producto, variante, almacén, inventario, método de envío, carritos, sesiones de checkout y pedidos) se eliminó de Railway al finalizar.

## Alcance diferido

- **Sin ciclo de vida de pedidos** (cancelar, reembolsar, timeline, endpoint formal de reorden) — 021-Orders.
- **Sin descarga de comprobantes/facturas** — depende de 022-Payments; la propia spec la condiciona con "cuando existan".
- **Sin integración Address↔Checkout** (usar una dirección guardada al hacer checkout) — ninguna spec la exige todavía; ambos modelos quedan deliberadamente independientes.
- **Sin gestión de sesiones nueva** — se reutilizó la ya construida en 003 sin cambios.
