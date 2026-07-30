# Checkout

Implementación de [`docs/prompts/018-Checkout.md`](prompts/018-Checkout.md). Módulo nuevo (`apps/api/src/modules/checkout`) que convierte el carrito (017) en una orden lista para pago, para invitados y clientes por igual.

## Decisión de alcance más grande de la sesión: crear 021-Orders (mínimo) desde aquí

El criterio de aceptación de 018 exige "generar una orden lista para pago", y su Definition of Done exige integrarse con 021-Orders, 022-Payments, 023-Shipping y 024-Coupons-Promotions **sin cambios estructurales** cuando esos módulos se construyan. Ninguno de los cuatro existe todavía. Se resolvió construyendo, desde Checkout, la forma mínima exacta de cada uno — el mismo patrón que 017 aplicó con `Coupon` para 024, llevado a mayor escala:

- **`Order`/`OrderItem`** (021, modelo mínimo): Checkout los crea al confirmar. El ciclo de vida completo (máquina de estados, cancelaciones, reembolsos, devoluciones, timeline, endpoints de historial/reorden) es responsabilidad de 021; aquí solo se persiste el resultado con la forma exacta de su spec §3.
  - 021 §4 lista 8 estados (Pending, Confirmed, Paid, Processing, Shipped, Delivered, Cancelled, Refunded) sin decir a cuál de los tres campos mínimos pertenece cada uno. Se repartieron sin ambigüedad en tres enums (`OrderStatus`, `PaymentStatus`, `FulfillmentStatus`) — ver comentario en `schema.prisma`.
  - Estado inicial al confirmar: `status: CONFIRMED`, `paymentStatus: PENDING`, `fulfillmentStatus: UNFULFILLED` — el pedido en sí queda confirmado (no es un borrador), solo pendiente de pago.
- **`CheckoutAddress`** (adelanto de 019-Customer-Account): una foto de captura, no una libreta de direcciones reutilizable — sin `customerId`, `type` ni `isDefault`. 019 definirá su propio `Address` guardable; hasta entonces, cada checkout (incluido el de invitados) captura la suya desde cero.
- **`ShippingMethod`** (mínimo de 023-Shipping): tarifa plana editable en el admin, sin transportistas, zonas de cobertura ni motor de cálculo por peso/dimensiones.
- **Impuesto**: sin módulo de impuestos en el roadmap todavía. Se implementó una tasa plana simplificada — IVA general de México, 16% sobre `(subtotal - descuento + envío)` — documentada como simplificación explícita, no una omisión. `TAX_RATE` en `checkout.constants.ts`.

## Invitados y clientes: reutiliza el guard de Cart, no lo reimplementa

Mismo mecanismo que 017: `x-session-id` para invitados + JWT opcional. En vez de reimplementar `OptionalAuthGuard`/`CurrentUserOptional`, `CheckoutModule` importa `CartModule` y reutiliza ambos directamente (se agregaron a los `exports` de `CartModule`). `CheckoutSession` es 1:1 con "el" carrito vigente de la sesión (`cartId` único en `schema.prisma` — spec §5 "una única sesión activa por carrito"); como un carrito ya `CONVERTED` nunca vuelve a ser encontrado como "el" carrito activo (Cart lo excluye de sus búsquedas), esa unicidad basta sin lógica adicional para cerrar sesiones viejas: un checkout nuevo sobre la misma sesión de invitado, después de haber confirmado, automáticamente crea una `CheckoutSession` nueva para el carrito nuevo.

## Qué se importa de Cart y qué se relee por cuenta propia

Dos criterios distintos, según de quién es el dato:

- **Lógica de negocio de Cart** (resolver "el" carrito, calcular su vista con descuento de cupón): se importan y reutilizan directamente `GetOrCreateCartUseCase`, `BuildCartViewUseCase`, `CART_REPOSITORY` y `COUPON_REPOSITORY` desde `CartModule` — igual que Checkout reutiliza el guard, no tiene sentido reimplementar reglas que ya son de Cart.
- **Datos de Catalog/Inventory** (precio vigente de una variante, disponibilidad de stock): Checkout construye sus propios puertos de solo lectura (`CheckoutProductLookupPort`, `CheckoutInventoryAvailabilityPort`) leyendo directamente `products`/`product_variants`/`inventory_items`, en vez de reutilizar los puertos internos de Cart (`CART_PRODUCT_LOOKUP`/`CART_INVENTORY_AVAILABILITY`) — mismo patrón CQRS de solo lectura usado en toda la sesión (015, 016, 017): cada módulo consumidor construye su propia lectura de las tablas físicas de otro dominio en vez de acoplarse a los tokens de inyección internos de ese dominio.

## La relectura de precios que 017 ya había anticipado

`CartItem.unitPrice` es una foto tomada al agregar/actualizar cantidad — el comentario en `schema.prisma` sobre ese campo dice explícitamente: _"no se re-sincroniza silenciosamente en cada lectura; esa revalidación completa es responsabilidad de 018-Checkout antes de confirmar el pedido"_. `ConfirmCheckoutUseCase` cumple exactamente eso: para cada línea del carrito, vuelve a consultar el precio vigente y la disponibilidad-para-venta vía `CheckoutProductLookupPort`, y usa **ese** precio (no el guardado en `CartItem`) para construir las líneas de la orden. `ReviewCheckoutUseCase`, en cambio, no relee precios — usa la vista de Cart tal cual (igual de "no sincronizada" que el propio carrito) porque es una validación blanda de apoyo a la UI; la única validación que de verdad congela algo es `ConfirmCheckoutUseCase`.

Esa misma revalidación en `ConfirmCheckoutUseCase` también recalcula el cupón (`CouponRepositoryPort.findByCode` + `computeDiscount` sobre el subtotal fresco, no el que mostraba el carrito) — si el cupón expiró o se desactivó entre la revisión y la confirmación, la orden se crea sin descuento y con `couponCode: null`, igual que Cart hace en su propia vista.

## `GetOrCreateCheckoutUseCase` vs. `ReviewCheckoutUseCase` vs. `ConfirmCheckoutUseCase`

- **`GetOrCreateCheckoutUseCase`**: resuelve el carrito vigente (delegado a Cart) y encuentra o crea su `CheckoutSession`. Se usa detrás de cada endpoint del flujo (`GET /checkout`, `POST /checkout/address`, `POST /checkout/shipping`) para no depender de que el frontend guarde un `checkoutSessionId` aparte — basta con `x-session-id` + JWT opcional, igual que Cart.
- **`ReviewCheckoutUseCase`**: validación blanda — carrito no vacío, dirección y método de envío capturados, todos los artículos siguen disponibles en la cantidad pedida — y devuelve la foto recalculada (subtotal/descuento/envío/impuesto/total). Es apoyo a la UI antes de mostrar el botón "Confirmar pedido".
- **`ConfirmCheckoutUseCase`**: la única que persiste algo de verdad. Revalida todo desde cero con datos frescos (ver arriba), crea `Order`+`OrderItem` en una sola escritura anidada de Prisma (atómica), marca el carrito `CONVERTED` (vía `CART_REPOSITORY.updateStatus`) y la sesión `CONFIRMED`, y registra `checkout.confirmed` en el log de auditoría. Es idempotente por diseño: si `session.status === CONFIRMED` ya, lanza `CheckoutAlreadyConfirmedError` — aunque en el flujo normal esto es defensa ante condiciones de carrera más que un camino alcanzable por el usuario, porque un segundo intento sobre la misma sesión de invitado ya resuelve un carrito nuevo (el anterior quedó `CONVERTED`) y por lo tanto una `CheckoutSession` nueva.

## Auditoría (spec §11)

Se registran `checkout.address_set`, `checkout.shipping_set` y `checkout.confirmed` (con `orderId`, `orderNumber` y `grandTotal` en los metadatos). **"Abandono cuando sea medible" queda deliberadamente sin implementar**: detectar abandono real requiere una noción de tiempo de inactividad y un job periódico que no existen en este código base (territorio de 032-Analytics o 034-Notifications) — `CheckoutStatus.ABANDONED` queda reservado en el enum para cuando ese mecanismo exista, pero nada lo asigna todavía.

## Endpoints

| Método | Ruta                          | Auth             | Descripción                                                                                                                           |
| ------ | ----------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/checkout`                   | opcional         | Obtiene (o crea) la sesión de checkout del carrito vigente                                                                            |
| GET    | `/checkout/shipping-methods`  | público          | Lista métodos de envío activos (añadido: el spec §7 exige un "Shipping Selector", que no puede renderizar opciones sin este endpoint) |
| POST   | `/checkout/address`           | opcional         | Captura contacto + dirección de envío (y opcionalmente facturación)                                                                   |
| POST   | `/checkout/shipping`          | opcional         | Selecciona método de envío                                                                                                            |
| POST   | `/checkout/review`            | opcional         | Valida y devuelve la foto recalculada antes de confirmar                                                                              |
| POST   | `/checkout/confirm`           | opcional         | Crea la orden, marca el carrito `CONVERTED` y la sesión `CONFIRMED`                                                                   |
| GET    | `/admin/shipping-methods`     | `admin:access`   | Lista métodos de envío                                                                                                                |
| POST   | `/admin/shipping-methods`     | `catalog:manage` | Crea un método de envío                                                                                                               |
| PATCH  | `/admin/shipping-methods/:id` | `catalog:manage` | Edita un método de envío                                                                                                              |
| DELETE | `/admin/shipping-methods/:id` | `catalog:manage` | Elimina un método de envío                                                                                                            |

## SDK

- `packages/sdk/src/checkout.types.ts`: `Checkout`, `CheckoutAddress`, `CheckoutAddressInput`, `ShippingMethod`, `Order`, `OrderItem`, y los enums `CheckoutStatus`/`OrderStatus`/`PaymentStatus`/`FulfillmentStatus`.
- `api-client.ts`: `getCheckout`, `getCheckoutShippingMethods`, `setCheckoutAddress`, `setCheckoutShippingMethod`, `reviewCheckout`, `confirmCheckout`, `listShippingMethods`/`createShippingMethod`/`updateShippingMethod`/`deleteShippingMethod`.

## Frontend admin

Página nueva `/shipping-methods`: alta inline (nombre, precio, días mín./máx.) + tabla con activar/desactivar y borrar — mismo patrón que `/coupons` (017) y `/search` (016).

## Frontend storefront

Página nueva `/checkout` con cuatro pasos controlados por estado local (no un provider global — a diferencia del carrito, el checkout es un flujo lineal confinado a una sola ruta):

- **`CheckoutProgress`**: indicador de pasos (Dirección → Envío → Revisión → Confirmación).
- **`AddressForm`**: contacto + dirección de envío, con casilla "usar la misma dirección para facturación" (marcada por default).
- **`ShippingSelector`**: lista de métodos de envío activos con precio y ventana de entrega estimada.
- **`CheckoutSummary`**: resumen de la revisión (líneas, subtotal, descuento, envío, IVA, total) + botón de confirmación.
- **`ErrorRecovery`**: banner con mensaje + botón de reintento, usado específicamente en el paso de revisión cuando `POST /checkout/review` o `/confirm` fallan (p. ej. stock que cambió entre pasos) — no se usa en los formularios de dirección/envío, donde un error de validación ya se corrige reeditando el propio formulario.
- El `sessionId` se reutiliza del `CartProvider` (017) — se agregó al contexto expuesto por `useCart()` — para que la `CheckoutSession` resuelva el mismo carrito que la Mini Cart/Drawer ya muestran.
- La página del carrito (`/cart`) reemplaza su botón "Ir a pagar" (antes deshabilitado, stub de 017) por un enlace real a `/checkout`. El `ShippingEstimator` de 017 (estimador de envío puramente visual, sin cálculo real) se eliminó por quedar superseded: el checkout ahora sí calcula un costo de envío real contra un método elegido.
- La PDP no cambia — "Comprar ahora" ya navegaba a `/cart` desde 017; desde ahí, "Ir a pagar" continúa el flujo real hasta 018.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): producto de prueba con una variante ($700.00), almacén e inventario, un método de envío de prueba ($120.00, 3-5 días), cliente y admin de prueba.

**Por API (curl)**, flujo completo invitado→confirmación: `POST /cart/items` agrega la variante; `GET /checkout/shipping-methods` lista el método de prueba; `GET /checkout` crea la sesión; `POST /checkout/address` captura dirección (billing por default = shipping); `POST /checkout/shipping` selecciona el método y el `grandTotal` se recalcula en vivo; `POST /checkout/review` valida y confirma los mismos números; `POST /checkout/confirm` crea la orden con `subtotal: 1400, shippingTotal: 120, taxTotal: 243.2, grandTotal: 1763.2` (matemática verificada a mano); una llamada posterior a `GET /cart` con la misma sesión confirma que se creó un carrito nuevo (el anterior quedó `CONVERTED`); un segundo `POST /checkout/confirm` sobre la misma sesión falla con `SHIPPING_ADDRESS_REQUIRED` porque ya resuelve el checkout del carrito nuevo (vacío), no el ya confirmado — comportamiento esperado, no un bug.

**Bug real encontrado y corregido durante esta verificación**: el frontend enviaba los campos opcionales de dirección (`company`, `addressLine2`, `phone`) como cadena vacía cuando el usuario los dejaba en blanco, y el DTO del backend (`@Length(1, 30)` sobre un campo `@IsOptional()`) rechaza cadenas vacías presentes (solo omite la validación cuando el campo es `undefined`, no cuando es `''`). Se corrigió en el frontend (`sanitizeAddress` en `apps/web/src/app/checkout/page.tsx`), omitiendo esos campos del payload en vez de enviarlos vacíos.

**Por navegador**: flujo completo en `apps/web` — PDP → carrito → `/checkout` → formulario de dirección → selector de envío (mostrando el método real con su precio) → revisión (mostrando el desglose correcto: $700.00 + $120.00 envío + $131.20 IVA = $951.20) → confirmación (mostrando el número de orden real `ORD-20260730-...` y el total). En `apps/admin`, `/shipping-methods` muestra el formulario de alta y el método de prueba con su precio y ventana de entrega.

Toda la data de prueba (usuarios, producto, variante, almacén, inventario, método de envío, direcciones, carritos, sesiones de checkout y órdenes) se eliminó de Railway al finalizar.

## Alcance diferido

- **Sin procesamiento de pago** (spec §2, explícito) — 022-Payments define `paymentStatus` en el modelo de `Order` ya creado aquí, sin cambios estructurales esperados.
- **Sin ciclo de vida de la orden más allá de la creación** (cancelaciones, reembolsos, devoluciones, timeline, reintentos de compra) — 021-Orders.
- **Sin motor de tarifas de envío real** (transportistas, zonas, peso/dimensiones, generación de guías, seguimiento) — 023-Shipping; `ShippingMethod` es un stand-in de tarifa plana.
- **Sin motor de impuestos por jurisdicción/categoría** — tasa plana simplificada (16% IVA México) hasta que exista un módulo dedicado.
- **Sin libreta de direcciones reutilizable** — 019-Customer-Account; `CheckoutAddress` es una foto de captura por checkout, no guardable entre compras.
- **Sin detección automática de abandono** — requiere una noción de tiempo/inactividad y un job periódico (032-Analytics/034-Notifications); el estado `ABANDONED` existe en el enum pero nada lo asigna todavía.
- **Sin actualización optimista en el frontend** (spec §9 la menciona como algo a "preparar") — mismo criterio que 017: se prefirió consistencia (esperar la respuesta del servidor) sobre percepción de velocidad, dado que cada paso ya revalida contra inventario/precios en el backend.
