# 021 -- Orders

## Engineering Specification

Version: 1.0

> Este documento define el sistema de Órdenes. Su propósito es
> transformar un checkout confirmado en un pedido auditable, trazable e
> integrado con pagos, inventario, envíos y notificaciones.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un módulo de órdenes robusto que gestione el ciclo de vida
completo de un pedido, desde su creación hasta su cierre.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Creación de órdenes.
-   Historial de pedidos.
-   Estados del pedido.
-   Línea de tiempo.
-   Cancelaciones.
-   Reembolsos (preparado para integración).
-   Devoluciones (preparado).
-   Integración con pagos.
-   Integración con envíos.
-   APIs públicas autenticadas.

------------------------------------------------------------------------

# 3. Modelo de Dominio

## Order

Campos mínimos:

-   id
-   orderNumber
-   customerId
-   status
-   paymentStatus
-   fulfillmentStatus
-   currency
-   subtotal
-   discountTotal
-   shippingTotal
-   taxTotal
-   grandTotal
-   createdAt
-   updatedAt

## OrderItem

Campos mínimos:

-   id
-   orderId
-   productId
-   variantId
-   sku
-   quantity
-   unitPrice
-   subtotal

------------------------------------------------------------------------

# 4. Estados

Estados base:

-   Pending
-   Confirmed
-   Paid
-   Processing
-   Shipped
-   Delivered
-   Cancelled
-   Refunded

Cada transición deberá validarse mediante reglas de negocio.

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   dominio Orders;
-   casos de uso;
-   repositorios;
-   máquina de estados;
-   integración con Payments, Shipping e Inventory;
-   APIs autenticadas.

------------------------------------------------------------------------

# 6. Frontend

Crear componentes para:

-   Orders Dashboard;
-   Order History;
-   Order Detail;
-   Order Timeline;
-   Invoice Download (preparado);
-   Reorder Button.

------------------------------------------------------------------------

# 7. APIs

Endpoints mínimos:

-   GET /orders
-   GET /orders/:id
-   POST /orders
-   POST /orders/:id/cancel
-   POST /orders/:id/reorder

------------------------------------------------------------------------

# 8. Rendimiento

Aplicar:

-   consultas indexadas;
-   paginación;
-   caché para lectura;
-   carga diferida del historial.

------------------------------------------------------------------------

# 9. Seguridad

Implementar:

-   autorización por propietario;
-   validación de estados;
-   protección contra modificaciones no autorizadas.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   creación;
-   cambios de estado;
-   cancelaciones;
-   reembolsos;
-   eventos de cumplimiento.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio Orders;
-   esquema Prisma;
-   migraciones;
-   APIs;
-   componentes frontend;
-   integración con Checkout, Payments, Shipping e Inventory;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   las órdenes se creen correctamente;
-   los estados sean consistentes;
-   el historial sea accesible;
-   las integraciones funcionen correctamente.

------------------------------------------------------------------------

# 13. Definition of Done

El módulo deberá integrarse sin cambios estructurales con:

-   018 Checkout
-   022 Payments
-   023 Shipping
-   024 Coupons & Promotions
-   025 Customer Service
