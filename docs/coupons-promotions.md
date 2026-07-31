# Coupons & Promotions

Implementación de [`docs/prompts/024-Coupons-Promotions.md`](prompts/024-Coupons-Promotions.md). Módulo nuevo (`apps/api/src/modules/promotions`) que agrega un motor de promociones con reglas de elegibilidad, prioridad y acumulación, integrado con el `Coupon` mínimo de 017-Shopping-Cart sin cambios estructurales en Cart ni en Orders/Checkout.

## Dos tipos de promoción, un solo motor

`Promotion.type` distingue `MANUAL_COUPON` (tiene `code`, el cliente lo introduce) de `AUTOMATIC` (sin código, se evalúa solo por reglas). Ambos comparten el mismo motor de elegibilidad (`domain/value-objects/promotion-eligibility.util.ts`): vigencia por fecha (`startsAt`/`endsAt`), límite de usos (`usageCount < usageLimit`), y reglas (`PromotionRule`: `MIN_CART_AMOUNT`, `PRODUCT`, `CATEGORY`, `BRAND`, `CUSTOMER`). El campo `value` de una regla es un string genérico interpretado según su tipo — número como string para `GTE`, ids separados por coma para `IN` — el mismo patrón de "campo/valor genérico interpretado por tipo" que `OrderStatusHistory` (021).

`PRODUCT_DETAIL_LOOKUP` se agregó a los `exports` de `CatalogModule` (cambio aditivo) para que `CATEGORY`/`BRAND` se puedan evaluar sin duplicar lógica de Catalog dentro de Promotions.

## Prioridad y acumulación: qué combinación de promociones aplica

`selectApplicablePromotions` ordena las promociones elegibles por `priority` ascendente (menor = primero) y siempre toma la de mayor prioridad. Si esa promoción **no** es acumulable (`stackable: false`), es la única que aplica — ninguna otra se suma, sin importar su propio `stackable`. Si sí es acumulable, las siguientes promociones elegibles se agregan una por una solo si **ellas mismas** son acumulables; una promoción no acumulable que llegaría después nunca se une a una combinación ya iniciada. `calculateTotalDiscount` suma los descuentos de las promociones seleccionadas y recorta el total al subtotal del carrito (mismo clamp que `CouponEntity` de Cart, 017). Cuatro pruebas unitarias cubren las cuatro ramas: ganador único no acumulable, combo de acumulables consecutivos, exclusión de un no-acumulable que rompería el combo, y ausencia total de elegibles.

## "Mirroring": cómo un cupón plano funciona sin tocar Cart ni Checkout

La Definition of Done exige que 017-Shopping-Cart y 018-Checkout no reciban cambios estructurales. La spec de Coupons-Promotions pide, a la vez, que un cupón manual funcione de punta a punta en el carrito y el pedido. La solución es **mirroring**: una promoción `MANUAL_COUPON` **sin reglas** (`PromotionEntity.isMirrorableToCart`, `type === 'MANUAL_COUPON' && rules.length === 0`) se sincroniza automáticamente, en cada creación/actualización vía `CreatePromotionUseCase`/`UpdatePromotionUseCase`, hacia la tabla `Coupon` ya existente de Cart (017) mediante `CartCouponMirrorService`, que reutiliza el `COUPON_REPOSITORY` ya exportado por `CartModule`. A partir de ahí, ese cupón "plano" recorre el flujo íntegro y sin cambios de Cart → Checkout → Order (`Cart.coupon`, `Order.couponCode`, `Order.discountTotal`) exactamente como cualquier cupón creado directamente en 017.

Una promoción **con reglas** (monto mínimo, producto/categoría/marca/cliente) **no se mirrorea**: queda solo en el motor de Promotions, es puramente informativa vía `POST /promotions/validate`, y **no se descuenta del total real del carrito** en este sprint — una limitación de alcance explícita y documentada, consistente con la restricción de "sin cambios estructurales" en Cart/Checkout. Si el código de una promoción mirroreada cambia en una edición, `UpdatePromotionUseCase` elimina el espejo del código anterior antes de sincronizar el nuevo.

## Registro de uso: un paso posterior a la confirmación, disparado por el cliente

No existe un sistema de eventos entre módulos en este backend, así que `RecordPromotionUsageUseCase` no se dispara automáticamente al confirmar un pedido. En su lugar, el storefront llama `POST /promotions/record-usage` inmediatamente después de que `POST /checkout/confirm` resuelve exitosamente (`apps/web/src/app/checkout/page.tsx`, `handleConfirm`) — el mismo patrón que 022-Payments estableció con `authorizePayment`/`capturePayment` como pasos secuenciales que el cliente orquesta tras la confirmación, sin tocar `ConfirmCheckoutUseCase` (018).

El caso de uso lee `Order.couponCode`/`discountTotal`/`customerId` vía `ORDER_REPOSITORY` (021, sin cambios) y busca la `Promotion` por código. Si el pedido no llevaba cupón, o el código no corresponde a ninguna promoción registrada, devuelve `null` silenciosamente — no es un error, es el caso normal de un pedido sin promoción. `PromotionUsage.orderId` es `@unique`, así que una segunda llamada para el mismo pedido devuelve el mismo registro sin duplicar ni volver a incrementar `Promotion.usageCount`.

## Endpoints

| Método                | Ruta                       | Auth           | Descripción                                                                                                                                                     |
| --------------------- | -------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET                   | `/promotions`              | Público        | Promotion Banner — promociones `AUTOMATIC` activas y vigentes, sin evaluar el carrito                                                                           |
| POST                  | `/promotions/validate`     | Público        | Con `code`: valida un cupón manual completo (reglas + límite de usos). Sin `code`: evalúa y selecciona promociones automáticas elegibles para el carrito actual |
| POST                  | `/promotions/record-usage` | JWT            | Registra el uso de la promoción de un pedido ya confirmado (idempotente)                                                                                        |
| GET/POST/PATCH/DELETE | `/admin/promotions`        | `admin:access` | CRUD de promociones, con reemplazo completo de reglas en cada actualización                                                                                     |
| GET                   | `/admin/promotions/usage`  | `admin:access` | Usage Dashboard — historial paginado de usos                                                                                                                    |

`GET /admin/promotions/usage` se declaró antes que `GET /admin/promotions/:id` en el controlador para que Nest no intente resolver `usage` como un `:id` — el mismo cuidado de orden de rutas que ya se aplicó en `/admin/shipments` (023).

## Auditoría

`AuditLogRepositoryPort` (Identity) registra: `promotion.created`, `promotion.updated`, `promotion.deleted`, `promotion.used`, `promotion.validation_rejected` (cuando `POST /promotions/validate` rechaza un código inválido o no elegible).

## SDK

- `packages/sdk/src/promotions.types.ts`: `PromotionType`, `PromotionDiscountType`, `PromotionStatus`, `PromotionRuleType`, `PromotionRuleOperator`, `Promotion`, `PromotionRule`, inputs de creación/actualización, `ValidatePromotionResult`, `RecordedPromotionUsage`, `PromotionUsageSummary`.
- `api-client.ts`: `listActivePromotions`, `validatePromotion`, `recordPromotionUsage`, `listPromotions`, `getPromotion`, `createPromotion`, `updatePromotion`, `deletePromotion`, `listPromotionUsage`.

## Frontend

- **Admin**: `/promotions` ("Promociones") — Promotion Manager: formulario de creación/edición con selector de tipo, tipo de descuento, prioridad, límite de usos, acumulable, y un editor dinámico de reglas de elegibilidad (agregar/quitar filas); tabla con activar/desactivar/eliminar. `/promotion-usage` ("Uso de promociones") — Usage Dashboard: tabla paginada de usos con promoción, pedido, descuento y fecha.
- **Storefront**: `PromotionBanner` (nuevo, en `/cart`) — anuncia promociones automáticas vigentes vía `GET /promotions`, sin evaluar el carrito actual. `DiscountSummary` (nuevo, en `/cart`, junto al `CouponBox` existente) — llama `POST /promotions/validate` sin código para mostrar qué promociones automáticas aplican al carrito real y el ahorro estimado; es informativo, el total mostrado en el resumen del carrito sigue siendo el de Cart (017). El checkout (`handleConfirm`) llama `recordPromotionUsage` tras confirmar el pedido, sin bloquear la confirmación si esa llamada falla.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): un cliente de prueba, un administrador de prueba, producto/variante (con peso)/almacén/inventario/método de envío de prueba, y tres promociones: un cupón plano sin reglas (mirroreable), un cupón con regla de monto mínimo (motor-only), y una promoción automática acumulable.

**Por API (curl)**: `GET /promotions` devuelve solo la promoción automática; `POST /promotions/validate` sin código devuelve la automática con su descuento calculado; con el código del cupón plano devuelve ese cupón elegible; con el código de monto mínimo (carrito de $1000 ≥ regla de $500) lo devuelve elegible con descuento fijo de $50; con un código inexistente responde `400 INVALID_PROMOTION_CODE`. Al crear una promoción-cupón sin reglas vía `POST /admin/promotions`, el mirroring la sincroniza automáticamente a `Coupon`: aplicarla vía el endpoint ya existente `POST /cart/coupon` (017, sin cambios) descuenta correctamente el 20% del subtotal ($1000 → $800). El checkout completo (dirección → método de envío → revisión → confirmación) produce un `Order` con `couponCode`/`discountTotal` correctos; `POST /promotions/record-usage` crea el registro de uso e incrementa `Promotion.usageCount`, y una segunda llamada para el mismo pedido devuelve el mismo registro sin duplicar. `GET /admin/promotions/usage` y `GET /admin/promotions/:id` reflejan el uso; `PATCH`/`DELETE` funcionan correctamente; sin token responde `401`, con un token sin `admin:access` responde `403`. El log de auditoría registra `promotion.created`, `promotion.updated`, `promotion.deleted`, `promotion.used` y `promotion.validation_rejected`.

**Por navegador**: en `apps/admin`, `/promotions` muestra el formulario de creación con reglas dinámicas y la tabla con las promociones reales y sus acciones; `/promotion-usage` muestra el historial de uso real. En el storefront, `/cart` muestra el `PromotionBanner` con la promoción automática, y tras agregar un producto, el `DiscountSummary` calcula y muestra el ahorro estimado real contra el motor de reglas.

Toda la data de prueba (clientes, admin, producto, variante, almacén, inventario, método de envío, promociones, reglas, usos, cupón mirroreado, carritos, sesiones de checkout, pedidos, direcciones) se eliminó de Railway al finalizar.

## Alcance diferido

- **Descuento real de promociones automáticas o con reglas en el total del carrito** — solo los cupones planos mirroreados (`MANUAL_COUPON` sin reglas) afectan el total real vía la tabla `Coupon` existente; las promociones automáticas y las que tienen reglas son informativas (`DiscountSummary`, `PromotionBanner`, `POST /promotions/validate`) hasta que Cart/Checkout tengan un motor de descuentos más rico — fuera de alcance por la restricción de "sin cambios estructurales" de este sprint.
- **Reglas por dimensión/volumen o combinaciones compuestas de reglas** (AND/OR anidados) — el motor evalúa una lista plana de reglas con `every()` (AND implícito); no hay agrupación OR ni reglas basadas en atributos de producto más allá de categoría/marca.
- **Registro automático de uso vía evento de dominio** — `RecordPromotionUsageUseCase` se dispara por una llamada explícita del storefront tras `confirmCheckout`, no por un webhook o bus de eventos interno (que no existe en este backend).
- **Notificaciones de expiración o límite de usos próximo a alcanzarse** — el motor solo evalúa vigencia/límite al momento de validar, sin alertas proactivas.
