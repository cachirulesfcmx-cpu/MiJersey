# 022 -- Payments

## Engineering Specification

Version: 1.0

> Este documento define la arquitectura del sistema de pagos. Su
> objetivo es proporcionar un flujo seguro, desacoplado y extensible
> para múltiples proveedores de pago.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un módulo de pagos preparado para múltiples pasarelas, con
manejo de autorizaciones, capturas, reembolsos, conciliación y eventos
asíncronos.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Múltiples proveedores (Stripe, Mercado Pago, PayPal y otros mediante
    adaptadores).
-   Autorización y captura.
-   Pagos inmediatos y diferidos.
-   Reembolsos totales y parciales.
-   Webhooks.
-   Conciliación.
-   Tokens de pago.
-   APIs internas.

No incluye almacenamiento de datos sensibles de tarjetas.

------------------------------------------------------------------------

# 3. Modelo de Dominio

## Payment

Campos mínimos:

-   id
-   orderId
-   provider
-   transactionId
-   amount
-   currency
-   status
-   authorizedAt
-   capturedAt
-   refundedAt
-   createdAt
-   updatedAt

## PaymentEvent

Campos mínimos:

-   id
-   paymentId
-   eventType
-   payload
-   processedAt

------------------------------------------------------------------------

# 4. Estados

Estados base:

-   Pending
-   Authorized
-   Captured
-   Failed
-   Cancelled
-   Refunded
-   Partially Refunded

Las transiciones deberán validarse mediante una máquina de estados.

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   dominio Payments;
-   adaptadores por proveedor;
-   casos de uso;
-   webhooks;
-   conciliación;
-   APIs internas.

------------------------------------------------------------------------

# 6. Frontend

Crear componentes para:

-   Payment Method Selector;
-   Payment Status;
-   Payment Error;
-   Retry Payment;
-   Refund History (administración).

------------------------------------------------------------------------

# 7. APIs

Endpoints mínimos:

-   POST /payments/authorize
-   POST /payments/capture
-   POST /payments/refund
-   POST /payments/webhook/:provider
-   GET /payments/:id

------------------------------------------------------------------------

# 8. Seguridad

Aplicar:

-   HTTPS obligatorio;
-   verificación de firmas de webhooks;
-   protección contra duplicados (idempotencia);
-   tokenización cuando aplique;
-   cumplimiento PCI mediante redirección o tokenización del proveedor.

------------------------------------------------------------------------

# 9. Rendimiento

Preparar:

-   procesamiento asíncrono;
-   colas para eventos;
-   reintentos automáticos;
-   trazabilidad completa.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   autorizaciones;
-   capturas;
-   reembolsos;
-   fallos;
-   recepción de webhooks.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio Payments;
-   esquema Prisma;
-   migraciones;
-   adaptadores de proveedores;
-   APIs;
-   integración con Orders;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   soporte múltiples proveedores;
-   procese autorizaciones y capturas correctamente;
-   gestione reembolsos;
-   procese webhooks de forma segura.

------------------------------------------------------------------------

# 13. Definition of Done

El módulo deberá integrarse sin cambios estructurales con:

-   018 Checkout
-   021 Orders
-   023 Shipping
-   031 Email Templates
-   034 Notifications
