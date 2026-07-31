# Payments

Implementación de [`docs/prompts/022-Payments.md`](prompts/022-Payments.md). Módulo nuevo (`apps/api/src/modules/payments`) que agrega autorización, captura y reembolso de pagos sobre los pedidos que crea 018-Checkout y gestiona 021-Orders.

## Un solo proveedor real: pago manual

No hay credenciales de Stripe, Mercado Pago ni PayPal en este entorno. En vez de simular una integración inverificable, se construyó `PaymentProviderPort` (`authorize`/`capture`/`refund`/`verifyWebhookSignature`) como punto de extensión real y `ManualPaymentProvider` como su único adaptador concreto: efectivo o transferencia bancaria confirmados por un agente — un método de pago legítimo usado por comercios reales, no un stub. "Autoriza" de inmediato (la promesa de pago del cliente) y queda pendiente de "capturar" cuando el agente confirma que el dinero llegó. Los demás proveedores quedan documentados como "preparados para integración", el mismo lenguaje que usa la propia spec (§2) para cubrir este caso.

`PaymentProviderRegistry` (`application/services`) resuelve el proveedor por nombre (`payments.module.ts` registra `ManualPaymentProvider` en el arranque); agregar un proveedor real más adelante no requiere tocar los casos de uso, solo registrar un nuevo adaptador.

## Autorizar/capturar son públicos; consultar exige sesión

Checkout (018) admite compra como invitado, así que no siempre hay una identidad de cliente contra la cual verificar propiedad en el momento de pagar. `POST /payments/authorize` y `POST /payments/capture` son `@Public()`: el `orderId` recién devuelto por `POST /checkout/confirm` es la capacidad para pagar ese pedido, de forma análoga al client secret de un proveedor de pagos real — nadie puede pagar un pedido cuyo id no conoce, y conocerlo ya viene de haber completado el checkout.

`GET /payments/:id` sí exige JWT y verifica propiedad, reutilizando `GetOrderUseCase` (exportado por `OrdersModule`, 021) para resolver el pedido dueño del pago y comparar contra el cliente autenticado. Ese `GetOrderUseCase` lanza su propio `OrderNotFoundError` (una clase de error de Orders, no de Payments); `GetPaymentUseCase` lo captura y relanza el `PaymentNotFoundError` propio de este módulo — de otro modo, un error no capturado por `@Catch(PaymentError)` (el filtro de excepciones de Payments) habría llegado a Nest como un 500 genérico en vez de un 404 correcto.

## Idempotencia al autorizar

`AuthorizePaymentUseCase` busca primero si el pedido ya tiene un pago `AUTHORIZED` o `CAPTURED` y, de ser así, devuelve ese pago en vez de crear uno nuevo — un doble clic en "pagar" o un reintento de red no genera transacciones duplicadas. Verificado en vivo: dos llamadas consecutivas a `authorize` sobre el mismo pedido devuelven el mismo `id` de pago.

## Reembolso parcial vs. total y `Order.paymentStatus`

`Payment.status` distingue `REFUNDED` de `PARTIALLY_REFUNDED`, y `canRefundPayment` permite reembolsos sucesivos mientras el pago esté `CAPTURED` o `PARTIALLY_REFUNDED` (así un reembolso parcial no bloquea otro reembolso parcial posterior sobre el mismo pago). `Order.paymentStatus`, en cambio, es el enum que ya fijaron 018/021 y no tiene un estado "parcialmente reembolsado" — cambiarlo habría sido una modificación estructural fuera del alcance de este sprint. Por eso un reembolso parcial actualiza `Payment.status` pero deja `Order.paymentStatus` en `PAID`; solo un reembolso que cubre el monto total del pago dispara `UpdateOrderStatusUseCase` (021) para mover el pedido a `paymentStatus: REFUNDED`. Verificado en vivo: un reembolso parcial de $50 sobre un pago de $266.80 deja el pedido en `PAID`; el reembolso posterior del resto lo mueve a `REFUNDED`.

## `UpdateOrderStatusUseCase`: la previsión de 021 se cumplió

021-Orders exportó `UpdateOrderStatusUseCase` desde `OrdersModule` sin ningún consumidor, documentado explícitamente como reservado para 022/023. `CapturePaymentUseCase` y `RefundPaymentUseCase` lo reutilizan tal cual (vía `imports: [OrdersModule]` en `payments.module.ts`) para mover `paymentStatus` a `PAID`/`FAILED`/`REFUNDED` y dejar constancia en `OrderStatusHistory` — cero cambios estructurales en Orders para integrar Payments, confirmando que el diseño anticipado era correcto.

## Webhook: firma HMAC sobre el cuerpo re-serializado

`POST /payments/webhook/:provider` es público (los webhooks de un proveedor real no traen sesión de usuario) y se protege verificando la firma `x-payment-signature` con HMAC-SHA256 (`node:crypto`, `createHmac` + `timingSafeEqual` para evitar timing attacks), usando el secreto `PAYMENTS_MANUAL_WEBHOOK_SECRET` (nuevo, con default de desarrollo en `env.schema.ts`).

Simplificación deliberada: se firma sobre `JSON.stringify(body)` — el objeto ya parseado y re-serializado por Nest — en vez de los bytes crudos de la petición. Un proveedor real (Stripe, Mercado Pago) firma sobre el cuerpo crudo antes de cualquier parseo, lo que exigiría capturar ese buffer con un middleware dedicado antes del body-parser global de `main.ts`. No se construyó ese middleware porque habría sido un cambio más amplio y riesgoso al arranque de la aplicación, fuera de proporción para un proveedor que de todas formas genera y verifica su propia firma en el mismo proceso.

`HandlePaymentWebhookUseCase` verifica la firma, ubica el pago por `(provider, transactionId)` y registra el evento crudo como `PaymentEvent` — deliberadamente no dispara transiciones de estado adicionales, porque `ManualPaymentProvider` ya resuelve todo de forma síncrona en `authorize`/`capture`/`refund`. Este handler es el punto de integración natural para un proveedor real que notifique resultados de forma asíncrona (pago confirmado minutos después, contracargo, etc.).

## Refund History (administración)

`GET /admin/payments/refunds` y `POST /admin/payments/refund` están gated por `admin:access` (sin permiso dedicado — mismo criterio que el Orders Dashboard de 021 y los métodos de envío de 018). El formulario de reembolso en `apps/admin` pide el id del pago directamente: todavía no existe un buscador de pagos por pedido en el Orders Dashboard, así que un agente lo obtiene del registro de auditoría (`payment.captured`) hasta que exista esa pieza adicional — una limitación conocida, documentada en el propio componente.

## Endpoints

| Método | Ruta                          | Auth            | Descripción                                                                  |
| ------ | ----------------------------- | --------------- | ---------------------------------------------------------------------------- |
| POST   | `/payments/authorize`         | Público         | Autoriza el pago de un pedido (idempotente)                                  |
| POST   | `/payments/capture`           | Público         | Captura un pago autorizado; mueve el pedido a `paymentStatus: PAID`/`FAILED` |
| GET    | `/payments/:id`               | JWT             | Detalle de un pago propio (404 si el pedido es de otro cliente)              |
| POST   | `/payments/webhook/:provider` | Público (firma) | Recibe notificaciones del proveedor; verifica `x-payment-signature`          |
| POST   | `/admin/payments/refund`      | `admin:access`  | Reembolsa un pago, total o parcial                                           |
| GET    | `/admin/payments/refunds`     | `admin:access`  | Historial paginado de reembolsos                                             |

## Auditoría

`AuditLogRepositoryPort` (Identity) registra: `payment.authorized`, `payment.captured`, `payment.refunded`.

## SDK

- `packages/sdk/src/payments.types.ts`: `PaymentTransactionStatus`, `Payment`, `AuthorizePaymentInput`, `RefundPaymentInput`, `PaymentSummary`.
- `api-client.ts`: `authorizePayment`, `capturePayment`, `getPayment`, `refundPayment`, `listRefunds`.

## Frontend

- **Storefront**: `checkout/page.tsx` agrega el paso de pago tras confirmar el pedido — `PaymentMethodSelector` (hoy con una única opción: pago manual) y `PaymentStatus` muestran el resultado de la cadena autorizar→capturar, con manejo de error y reintento (`ErrorRecovery`, ya existente). `CheckoutSummary` actualizó su texto para reflejar que el pago ocurre en un paso posterior a confirmar el pedido, ahora real.
- **Admin**: página `/payments` ("Reembolsos") — historial de reembolsos paginado y formulario mínimo para iniciar un reembolso por id de pago.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): dos clientes de prueba, un administrador de prueba, producto/variante/almacén/inventario/método de envío de prueba.

**Por API (curl)**: `POST /payments/authorize` autoriza un pedido recién confirmado; una segunda llamada sobre el mismo pedido devuelve el mismo pago (idempotencia); `POST /payments/capture` mueve el pedido a `paymentStatus: PAID`; `GET /payments/:id` con el cliente dueño responde `200`, con el otro cliente responde `404`, sin token responde `401`; el webhook con firma válida responde `200`, con firma inválida `401`, sin firma `401`; `POST /admin/payments/refund` sin `admin:access` responde `403`; un reembolso parcial de $50 deja el pedido en `PAID` con `Payment.status: PARTIALLY_REFUNDED`; el reembolso del resto mueve el pago a `REFUNDED` y el pedido a `paymentStatus: REFUNDED`; `GET /admin/payments/refunds` lista el reembolso con el monto total original.

**Por navegador**: flujo completo de storefront desde carrito hasta `POST /checkout/confirm`, seguido del paso de pago (`PaymentMethodSelector` → autorizar → capturar) llegando a "Pago confirmado"; en `apps/admin`, `/payments` muestra el reembolso procesado por curl en la tabla de historial.

Toda la data de prueba (clientes, admin, producto, variante, almacén, inventario, método de envío, órdenes, pagos, eventos de pago, carritos, sesiones de checkout, direcciones) se eliminó de Railway al finalizar.

## Alcance diferido

- **Proveedores reales (Stripe, Mercado Pago, PayPal)** — la spec los marca "preparado para integración"; `PaymentProviderPort`/`PaymentProviderRegistry` son el punto de extensión, sin credenciales disponibles en este entorno para verificarlos de punta a punta.
- **Firma de webhook sobre bytes crudos** — se firma sobre `JSON.stringify(body)`; una integración real exigiría un middleware de captura de cuerpo crudo antes del body-parser global.
- **Buscador de pagos por pedido en el Orders Dashboard** — el formulario de reembolso de administración pide el id del pago directamente; un buscador dedicado queda fuera de este sprint.
