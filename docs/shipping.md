# Shipping

Implementación de [`docs/prompts/023-Shipping.md`](prompts/023-Shipping.md). Módulo nuevo (`apps/api/src/modules/shipping`) que agrega un motor real de cálculo de tarifas por zona y peso, generación de envíos y seguimiento sobre los pedidos de 021-Orders, integrado con el pago confirmado de 022-Payments.

## Dos capas de "método de envío" que coexisten

018-Checkout ya tenía `ShippingMethod`: una tarifa plana editable en administración, sin transportistas ni cálculo por peso — documentado explícitamente en su momento como "eso es 023-Shipping". Este módulo no reemplaza esa tabla ni sus casos de uso (`ListShippingMethodsUseCase`, `SetCheckoutShippingMethodUseCase` siguen intactos): construye **Carrier**, **ShippingZone** y **ShippingRate** como un sistema nuevo y paralelo, con su propio motor de cálculo real por destino y peso.

En el storefront, el paso "Envío" del checkout ahora muestra ambos: el `ShippingEstimator` (023) calcula y muestra cotizaciones reales según la dirección capturada y el peso del carrito, de forma puramente informativa; el `ShippingSelector` (018, sin cambios) sigue siendo el que efectivamente fija el método de envío de la sesión de checkout. Ninguno de los dos depende del otro — es la misma relación que 021-Orders estableció con `/me/orders` (019): una superficie nueva y más completa junto a la que ya existía, sin tocarla.

## El motor de cálculo: zona + peso

`ShippingZone` coincide por país y, opcionalmente, por lista de estados (`states` vacío = todo el país) — suficiente para el `POST /shipping/rates` sin construir un sistema de rangos de código postal, fuera de proporción para este sprint. `ShippingRate` combina una zona con un transportista y define `basePrice + pricePerKg * pesoTotalKg`, con envío gratis si `freeShippingThreshold` está definido y el subtotal del carrito lo alcanza.

El peso total se calcula sumando `ProductVariant.weight` (ya existía desde 007-Product-Variants) de cada línea del carrito. Cuando una variante no tiene peso capturado, se usa `DEFAULT_ITEM_WEIGHT_KG` (0.5 kg) para no romper el cálculo por datos incompletos del catálogo — mismo espíritu que otras "reglas de sentido común documentadas" de esta sesión.

`CalculateShippingRatesUseCase` importa `CartModule` (para leer el carrito por `sessionId`/`customerId`) y `CatalogModule` (para el peso de cada variante) — `PRODUCT_VARIANT_REPOSITORY` se agregó a los `exports` de `CatalogModule`, un cambio aditivo sin tocar su lógica interna.

## Un solo transportista real: reparto autogestionado

No hay credenciales de FedEx, DHL, Estafeta ni Correos de México en este entorno. `CarrierProviderPort` (`createShipment`) es el punto de extensión para esos transportistas reales, documentados como "preparados para integración" (spec §2, mismo lenguaje que ya usaron 022-Payments para Stripe/Mercado Pago/PayPal). `ManualCarrierProvider` es el único adaptador concreto: genera su propio número de guía (`MJ-XXXXXXXX`) y no produce PDF de etiqueta (`labelUrl: null`) — un modelo real de mensajería propia o contratada sin integración API, no un simulador. El registro de `Carrier` en la base de datos es solo un dato configurable (nombre/código); "múltiples transportistas" (spec §4) se cumple como datos administrables aunque hoy exista un único adaptador computacional.

## Generar un envío exige un pedido pagado

`CreateShipmentUseCase` valida `Order.paymentStatus === 'PAID'` (leído vía `ORDER_REPOSITORY`, 021, sin importar Payments) antes de generar la guía — la integración con 022-Payments que pide la Definition of Done, sin cambios estructurales en ese módulo. Intentar generar un envío para un pedido no pagado devuelve `409 ORDER_NOT_PAYABLE_FOR_SHIPMENT`.

Al crear el envío, `UpdateOrderStatusUseCase` (021, exportado sin consumidores desde que se construyó Orders, ya reutilizado por 022-Payments) mueve `fulfillmentStatus` a `PROCESSING` — la misma pieza reservada demostrando otra vez que el diseño anticipado en 021 fue correcto.

## Un pedido, un envío activo a la vez

No hay restricción a nivel de esquema (`Shipment.orderId` no es único, a propósito, igual que `Payment.orderId` en 022 permite reintentos tras un `FAILED`). `CreateShipmentUseCase` sí valida en el caso de uso: si el pedido ya tiene un envío en un estado no terminal, devuelve `409 SHIPMENT_ALREADY_ACTIVE`. Un envío `FAILED` se considera terminal para efectos de bloqueo — permite generar un nuevo intento sin quedar atascado, la razón por la que `FAILED` se agrupó junto a `DELIVERED`/`RETURNED` en `canTransitionShipment`.

## Transiciones de estado y su reflejo en el pedido

`ShipmentStatus`: `LABEL_CREATED → IN_TRANSIT → DELIVERED`, con `FAILED`/`RETURNED` como desenlaces alternos. Solo `DELIVERED` y `RETURNED` son realmente terminales para el seguimiento (no admiten más actualizaciones); `FAILED` también se trata como terminal porque un intento fallido no se "reintenta" actualizando el mismo registro — se genera un envío nuevo.

Solo dos transiciones tienen equivalente en `FulfillmentStatus` (fijado en 021): `IN_TRANSIT → SHIPPED` y `DELIVERED → DELIVERED`. `FAILED`/`RETURNED` quedan registrados en la línea de tiempo del envío sin mover el pedido — ese enum no modela incidencias de transporte, la misma clase de simplificación documentada que el reembolso parcial de 022-Payments (que tampoco tiene un estado intermedio en `Order.paymentStatus`).

## Seguimiento público, generación y actualización administrativas

`GET /shipping/track/:trackingNumber` es público y sin verificación de propiedad — el número de guía es la capacidad para consultarlo, igual que el `orderId` en Payments (022): quien lo conoce ya lo recibió por un canal legítimo. `GET /shipping/orders/:orderId` sí exige JWT y reutiliza `GetOrderUseCase` (021) para la comprobación de propiedad, con el mismo patrón cross-módulo de `GetPaymentUseCase` (022): el `OrderNotFoundError` de Orders se captura y se relanza como el propio de Shipping para que `ShippingExceptionFilter` lo maneje correctamente.

`POST /shipping/shipments` y `PATCH /admin/shipments/:id/status` son exclusivamente administrativos — generar un envío o marcarlo en tránsito/entregado es una acción operativa, no algo que el cliente dispare, mismo criterio que `POST /admin/payments/refund` (022). Ambos reutilizan `admin:access` sin permiso dedicado.

## Endpoints

| Método                | Ruta                              | Auth           | Descripción                                                     |
| --------------------- | --------------------------------- | -------------- | --------------------------------------------------------------- |
| GET                   | `/shipping/methods`               | Público        | Listado genérico de tarifas configuradas, sin destino           |
| POST                  | `/shipping/rates`                 | Público        | Cotización real por destino y peso del carrito (`x-session-id`) |
| GET                   | `/shipping/track/:trackingNumber` | Público        | Estado y línea de tiempo de un envío                            |
| GET                   | `/shipping/orders/:orderId`       | JWT            | Envío de un pedido propio (404 si es de otro cliente)           |
| POST                  | `/admin/shipments`                | `admin:access` | Genera un envío para un pedido pagado                           |
| PATCH                 | `/admin/shipments/:id/status`     | `admin:access` | Actualiza el estado de un envío                                 |
| GET/POST/PATCH/DELETE | `/admin/shipping/carriers`        | `admin:access` | CRUD de transportistas                                          |
| GET/POST/PATCH/DELETE | `/admin/shipping/zones`           | `admin:access` | CRUD de zonas de cobertura                                      |
| GET/POST/PATCH/DELETE | `/admin/shipping/rates`           | `admin:access` | CRUD de tarifas                                                 |

## Auditoría

`AuditLogRepositoryPort` (Identity) registra: `shipping.carrier.created/updated/deleted`, `shipping.zone.created/updated/deleted`, `shipping.rate.created/updated/deleted`, `shipping.shipment.created`, `shipping.shipment.status_changed`.

## SDK

- `packages/sdk/src/shipping.types.ts`: `Carrier`, `ShippingZone`, `ShippingRate`, `ShippingMethodListing`, `ShippingQuote`, `Shipment`, `ShipmentEvent`, `ShipmentStatus`, inputs de creación/actualización.
- `api-client.ts`: `getShippingMethodListing`, `calculateShippingRates`, `trackShipment`, `getShipmentForOrder`, CRUD de `listCarriers`/`createCarrier`/`updateCarrier`/`deleteCarrier` (y equivalentes para zonas y tarifas), `createShipment`, `updateShipmentStatus`.

## Frontend

- **Admin**: `/shipping-config` ("Config. de envíos") — Shipping Configuration (spec §6): tres secciones (transportistas, zonas, tarifas) con formulario de creación y tabla con activar/desactivar/eliminar. `/shipments` ("Envíos") — formulario para generar un envío (id de pedido + transportista + servicio) y otro para actualizar su estado; igual que el formulario de reembolsos de 022, pide el id directamente porque todavía no existe un buscador de pedidos "listos para enviar" en el Orders Dashboard.
- **Storefront**: `ShippingEstimator` (nuevo) embebido en el paso "Envío" del checkout, junto al `ShippingSelector` existente. `ShipmentStatus` (nuevo) en `/account/orders/[id]` — Shipping Status + Shipment Tracking para el cliente, solo visible cuando el pedido ya tiene un envío generado. `/track` (nueva página pública) — Shipment Tracking independiente de sesión, para cualquiera con el número de guía.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): dos clientes de prueba, un administrador de prueba, producto/variante (con peso)/almacén/inventario/método de envío de prueba, un transportista, una zona (México) y una tarifa ($50 base + $10/kg).

**Por API (curl)**: `POST /shipping/rates` calcula correctamente $100 para 5 kg (2 unidades de 2.5 kg) y devuelve `[]` para un destino sin zona configurada; `GET /shipping/methods` lista la tarifa con el nombre del transportista; flujo completo carrito → checkout → confirmar pedido → autorizar/capturar pago; generar un envío antes de pagar devuelve `409 ORDER_NOT_PAYABLE_FOR_SHIPMENT`; tras pagar, `POST /admin/shipments` genera la guía y mueve el pedido a `fulfillmentStatus: PROCESSING`; un segundo intento de envío para el mismo pedido devuelve `409 SHIPMENT_ALREADY_ACTIVE`; `GET /shipping/orders/:orderId` del dueño responde `200`, de otro cliente `404`, sin token `401`; `GET /shipping/track/:trackingNumber` es público y refleja la línea de tiempo; actualizar el envío a `IN_TRANSIT` mueve el pedido a `SHIPPED`, a `DELIVERED` lo mueve a `DELIVERED`; actualizar un envío ya entregado devuelve `409 SHIPMENT_NOT_UPDATABLE`; endpoints admin sin `admin:access` devuelven `403`.

**Por navegador**: en `apps/admin`, `/shipping-config` muestra transportistas/zonas/tarifas reales con sus relaciones correctamente resueltas; `/shipments` genera envíos y actualiza estados. En el storefront, el paso "Envío" del checkout muestra el `ShippingEstimator` con la cotización real ($75.00 para 2.5 kg) junto al selector de tarifa plana existente; `/account/orders/:id` muestra la sección "Envío" con el estado y número de guía, y la línea de tiempo del pedido incluye los eventos de envío; `/track` muestra el estado y la línea de tiempo completa de un envío sin necesidad de sesión.

Toda la data de prueba (clientes, admin, producto, variante, almacén, inventario, método de envío, transportista, zona, tarifa, pedidos, pagos, envíos, eventos de envío, carritos, sesiones de checkout, direcciones) se eliminó de Railway al finalizar.

## Alcance diferido

- **Transportistas reales (FedEx, DHL, Estafeta, Correos de México)** — la spec los marca "preparado para integración"; `CarrierProviderPort` es el punto de extensión, sin credenciales disponibles en este entorno.
- **Generación de guías en PDF** — `ManualCarrierProvider.createShipment` no produce `labelUrl`; depende de un transportista real que la emita.
- **Cálculo por dimensiones (largo/ancho/alto)** — el motor solo usa peso (`ProductVariant.weight`); volumen/dimensiones quedan fuera de alcance.
- **Zonas por rango de código postal** — la coincidencia es por país + estado; un sistema de rangos de CP es una futura extensión de `ShippingZone`.
- **Procesamiento asíncrono / colas para integración con transportistas** (spec §8) — no aplica todavía sin un transportista real que lo justifique; el único adaptador (`ManualCarrierProvider`) resuelve todo de forma síncrona.
