# Shopping Cart

Implementación de [`docs/prompts/017-Shopping-Cart.md`](prompts/017-Shopping-Cart.md). Módulo nuevo (`apps/api/src/modules/cart`) que da carrito persistente a invitados y clientes, con fusión al iniciar sesión, cupones mínimos y sincronización con inventario en tiempo real.

## Invitados y clientes con el mismo endpoint: `OptionalAuthGuard`

El spec pide que el carrito funcione para ambos sin dos superficies de API distintas. El guard global (`JwtAuthGuard`) siempre exige un JWT válido, así que no sirve aquí. Se creó `OptionalAuthGuard` (modelado sobre el mismo, en `presentation/guards/optional-auth.guard.ts`): si llega `Authorization`, lo verifica y llena `request.user` igual que el guard global; si no llega, deja pasar sin usuario. Solo lanza si llega un token presente pero inválido/expirado — no hay forma de "colarse" con un token corrupto. Se empareja con el decorador `@CurrentUserOptional()`, que devuelve `AccessTokenPayload | undefined` en vez de forzar no-nulo.

El invitado se identifica con el header `x-session-id` (UUID generado en el storefront vía `crypto.randomUUID()` y persistido en `localStorage`, mismo patrón que 016 usó para `sessionId` de búsqueda — este módulo es el que "formaliza" ese concepto, como quedó documentado en `docs/search.md`). Requirió exportar `TOKEN_SERVICE` desde `IdentityModule` (antes no estaba en `exports`) para que `CartModule` pudiera inyectarlo en el guard sin duplicar lógica de verificación de JWT.

`PublicCartController` expone todas las rutas bajo `@Public()` + `@UseGuards(OptionalAuthGuard)` — la autorización real (invitado vs. dueño del carrito) vive en los casos de uso, no en el guard.

## Un carrito activo por cliente + fusión al iniciar sesión

El spec (§4) exige ambas cosas como reglas de negocio separadas, y en la práctica son dos casos de uso distintos:

- **`GetOrCreateCartUseCase`** resuelve "el" carrito activo para la petición actual: si hay cliente autenticado, usa su carrito activo si existe; si no tiene uno pero la sesión actual sí tiene un carrito de invitado, lo **adopta** (`attachCustomer`) sin pasar por el endpoint de fusión — cubre el caso común de "primera compra después de loguearse en la misma sesión"; si no hay nada, crea uno nuevo.
- **`MergeCartUseCase`** cubre el caso donde el cliente **ya** tiene un carrito activo (de una sesión anterior) y la sesión de invitado actual trae uno aparte con items propios — el caso real de "agregué cosas como invitado en el celular, ya tengo cuenta con cosas en la compu, inicio sesión en el celular". Cuatro ramas: sin carrito de invitado → delega a `GetOrCreateCartUseCase`; el carrito de invitado ya es del cliente → no-op; cliente sin carrito propio → promueve el de invitado; ambos existen → por cada línea del carrito de invitado, busca coincidencia por `variantId` en el carrito del cliente y suma cantidades (con tope en la disponibilidad de inventario vigente), o crea una línea nueva si no había coincidencia; al final borra los items del carrito de invitado y lo marca `MERGED` (no se borra el registro, por auditabilidad) y registra `cart.merged` en el log de auditoría con `{fromCartId, toCartId, sessionId}`.

En el frontend, `CartProvider` dispara `mergeCart` automáticamente al detectar que `accessToken` pasó de vacío a presente (login), exactamente una vez por sesión de login.

## Cupones: alcance mínimo, sin motor de promociones

El spec pide "cupones" (§2) pero no un documento propio — 024-Coupons-Promotions es quien construirá reglas, apilamiento, límites de uso y programación. Se modeló `Coupon` como lo mínimo operable: `code` único, `type: PERCENTAGE | FIXED`, `value: Decimal(10,2)`, `isActive`, `expiresAt` opcional. `CouponEntity.computeDiscount(subtotal)` calcula el descuento y lo recorta a `[0, subtotal]` (`Math.min(Math.max(raw, 0), subtotal)`) — nunca un total negativo ni un descuento mayor al propio subtotal.

El descuento **nunca se persiste**: `Cart.couponCode` guarda solo el código aplicado; `BuildCartViewUseCase` recalcula `discount`/`total` en cada lectura contra el subtotal y la validez actuales del cupón. Si un cupón aplicado deja de ser válido (se desactivó o expiró) después de haberse aplicado, el carrito lo sigue mostrando pero con `coupon.isValid: false` y `discount: 0` — decisión deliberada de no borrar en silencio la selección del usuario; el frontend puede explicarle por qué ya no aplica.

Administración vía `/admin/coupons` (CRUD), reutilizando `admin:access`/`catalog:manage` — no se creó un permiso `coupons:manage` dedicado para cuatro rutas de bajo tráfico, mismo criterio que 016 aplicó a sinónimos.

## Sincronización con inventario

`CartInventoryAvailabilityPort` (implementado por `PrismaCartInventoryAvailabilityRepository`, lectura directa a `inventory_items`) es el mismo patrón CQRS de solo-lectura usado en toda la sesión — Cart no importa `InventoryModule`. Se valida disponibilidad en tres momentos: al agregar (`AddCartItemUseCase`, contra la cantidad _sumada_ si la variante ya estaba en el carrito), al actualizar cantidad (`UpdateCartItemUseCase`) y al fusionar carritos (tope en `MergeCartUseCase`). En los tres casos, si no alcanza el inventario se lanza `InsufficientInventoryError` con la cantidad realmente disponible en el mensaje, para que el frontend pueda ofrecer el máximo posible en vez de solo rechazar.

`unitPrice` se refresca al valor vigente de la variante en cada `add`/`update` — incluso cuando solo se están sumando más unidades a una línea existente — para que el carrito nunca muestre un precio congelado si el precio del producto cambió entre visitas.

## Corrección de un bug real: `Decimal(10,2)` no son centavos

Durante la verificación en vivo del storefront se detectó que `ProductDetailClient.tsx` (015), y por herencia `CartItemRow.tsx`/`OrderSummary.tsx` (017), dividían el precio entre 100 antes de formatearlo — asumiendo que `ProductVariant.price` guardaba centavos enteros. Al leer `VariantsManager.tsx` (admin) se confirmó que la convención real del proyecto es la contraria: `Decimal(10,2)` guarda el monto completo tal cual se captura (`899.00` = $899.00 MXN), sin conversión. El bug pasó inadvertido en pruebas anteriores porque los precios de prueba eran múltiplos redondos de 100. Se corrigió quitando la división en las tres funciones `formatPrice` afectadas — `CartItem.unitPrice`/`subtotal` y `Coupon.value` siguen la misma convención y no tenían el bug porque nunca se formatearon con la función incorrecta.

## Sin header de sitio: Mini Cart como botón flotante

No existe todavía un header/nav compartido en el storefront (llega con 028-Navigation-Builder), así que el "Mini Cart" del spec (§6) se implementó como `CartLauncher.tsx`: botón flotante fijo en la esquina inferior derecha, ícono de carrito en SVG (sin emoji) con badge de cantidad, que abre `CartDrawer.tsx` (slide-over). Es un placeholder documentado — cuando 028 exista, este botón debería moverse al header real.

## Shipping Estimator: solo UI, sin cálculo real

`ShippingEstimator.tsx` es un input de código postal con un mensaje estático ("El costo de envío para X se calculará en el checkout") — no calcula ninguna tarifa real porque 023-Shipping no existe todavía. Mismo criterio que 015 aplicó a "no inventar productos populares falsos": mejor un stub honesto que un número inventado.

## Endpoints

| Método | Ruta                 | Auth             | Descripción                                                                                                          |
| ------ | -------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| GET    | `/cart`              | opcional         | Obtiene (o crea) el carrito activo de la sesión/cliente                                                              |
| POST   | `/cart/items`        | opcional         | Agrega una variante al carrito                                                                                       |
| PATCH  | `/cart/items/:id`    | opcional         | Actualiza la cantidad de una línea                                                                                   |
| DELETE | `/cart/items/:id`    | opcional         | Elimina una línea                                                                                                    |
| POST   | `/cart/coupon`       | opcional         | Aplica un cupón                                                                                                      |
| DELETE | `/cart/coupon`       | opcional         | Elimina el cupón aplicado (añadido: spec §9 exige auditar la eliminación de cupones, lo que requiere esta capacidad) |
| POST   | `/cart/merge`        | requiere JWT     | Fusiona el carrito de invitado (por `sessionId`) al del cliente autenticado                                          |
| GET    | `/admin/coupons`     | `admin:access`   | Lista cupones                                                                                                        |
| POST   | `/admin/coupons`     | `catalog:manage` | Crea un cupón                                                                                                        |
| PATCH  | `/admin/coupons/:id` | `catalog:manage` | Edita un cupón                                                                                                       |
| DELETE | `/admin/coupons/:id` | `catalog:manage` | Elimina un cupón                                                                                                     |

## SDK

- `packages/sdk/src/cart.types.ts`: `Cart`, `CartItemView`, `CartCouponView`, `CartStatus`, `CouponType`, `AddCartItemInput`, `Coupon`, `CreateCouponInput`, `UpdateCouponInput`.
- `api-client.ts`: `getCart`, `addCartItem`, `updateCartItem`, `removeCartItem`, `applyCartCoupon`, `removeCartCoupon`, `mergeCart`, `listCoupons`/`createCoupon`/`updateCoupon`/`deleteCoupon`.

## Frontend admin

Página nueva `/coupons`: alta inline (código, tipo, valor, expiración) + tabla con activar/desactivar y borrar — mismo patrón que `/search` (016) y `/redirects` (012).

## Frontend storefront

- `CartProvider` (`apps/web/src/providers/cart-provider.tsx`): contexto global montado dentro de `AuthProvider` en el layout raíz. Mantiene `sessionId` (localStorage), estado del carrito y todas las mutaciones (`addItem`, `updateItem`, `removeItem`, `applyCoupon`, `removeCoupon`, `refresh`), más el efecto de fusión automática al iniciar sesión descrito arriba.
- `CartLauncher` + `CartDrawer`: Mini Cart flotante (ver más arriba).
- `apps/web/src/app/cart/page.tsx`: página completa con `CartItemRow`, `OrderSummary`, `CouponBox`, `ShippingEstimator` y un botón "Ir a pagar" deshabilitado (stub visual hasta 018-Checkout).
- PDP (`ProductDetailClient.tsx`, 015): los botones "Agregar al carrito"/"Comprar ahora", antes deshabilitados con el tooltip "Disponible cuando se implemente el carrito (017)", ahora llaman a `useCart().addItem()`; "Comprar ahora" además navega a `/cart` tras agregar.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): producto de prueba con una variante ("Cart Test Jersey", talla M, `price: 500.00`), almacén e inventario de prueba, cliente y admin de prueba, cupón `CARTTEST10` (10%).

Por API (curl): `GET /cart` sin sesión crea un carrito de invitado; `POST /cart/items` agrega la variante y refleja `unitPrice`/`subtotal` correctos; `POST /cart/coupon` aplica `CARTTEST10` y el `discount`/`total` calculados en la respuesta son correctos; `PATCH /cart/items/:id` actualiza cantidad; intentar una cantidad mayor a la disponible devuelve `InsufficientInventoryError` con la cantidad real disponible; `DELETE /cart/coupon` y `DELETE /cart/items/:id` funcionan; login del cliente de prueba con un carrito de invitado existente lo adopta automáticamente vía `GetOrCreateCartUseCase`; una fusión real (carrito de invitado con 1 unidad + carrito de cliente ya existente con 3 unidades de la misma variante) sumó correctamente a 4 y marcó el carrito de invitado como `MERGED`.

Por navegador: se detectó y corrigió en vivo el bug de precios (`/100` erróneo) descrito arriba — antes del fix, la PDP mostraba "$5.00" para una variante de $500.00 mientras el drawer mostraba "$500.00" (inconsistentes entre sí); después del fix, PDP, badge del `CartLauncher`, `CartDrawer` (item, subtotal, total) y `/cart` muestran "$500.00" de forma consistente. Se verificó también `/coupons` en `apps/admin`, mostrando el cupón de prueba con su estado correcto.

Toda la data de prueba (usuarios, producto, variante, almacén, inventario, cupón, carritos e items) se eliminó de Railway al finalizar.

## Alcance diferido

- **Sin proceso de pago** (spec §2, explícito) — llega con 018-Checkout.
- **Sin motor de promociones** (reglas, apilamiento, límites de uso, programación) — `Coupon` es un stand-in mínimo hasta 024-Coupons-Promotions.
- **Sin cálculo real de envío** — `ShippingEstimator` es un stub visual hasta 023-Shipping.
- **Sin Mini Cart integrado a un header** — no existe header compartido hasta 028-Navigation-Builder; `CartLauncher` es un botón flotante provisional.
- **Sin actualización optimista en el frontend** (spec §8 la menciona como algo a "preparar"): las mutaciones esperan la respuesta del servidor antes de reflejar el nuevo estado — se prefirió consistencia sobre percepción de velocidad dado que cada mutación ya revalida contra inventario en el backend; quedaría para una iteración de UX posterior si se vuelve necesario.
