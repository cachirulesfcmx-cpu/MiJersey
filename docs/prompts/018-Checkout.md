# 018 -- Checkout

## Engineering Specification

Version: 1.0

> Este documento define el flujo de Checkout. Su propósito es convertir
> el carrito en una orden validada mediante un proceso rápido, seguro y
> optimizado para maximizar la conversión.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un checkout modular, resiliente y preparado para integrarse
con pagos, envíos e impuestos sin fricción.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Checkout para invitados y clientes.
-   Captura de datos del cliente.
-   Direcciones de envío y facturación.
-   Métodos de envío.
-   Resumen del pedido.
-   Validación de inventario.
-   Cálculo de impuestos.
-   Confirmación de orden.
-   APIs públicas.

No incluye el procesamiento del pago (Documento 022).

------------------------------------------------------------------------

# 3. Flujo

1.  Identificación del cliente.
2.  Dirección de envío.
3.  Dirección de facturación.
4.  Método de envío.
5.  Revisión del pedido.
6.  Selección de pago.
7.  Confirmación.

El sistema deberá permitir checkout como invitado.

------------------------------------------------------------------------

# 4. Modelo de Dominio

## CheckoutSession

Campos mínimos:

-   id
-   cartId
-   customerId
-   shippingAddressId
-   billingAddressId
-   shippingMethodId
-   status
-   createdAt
-   updatedAt

------------------------------------------------------------------------

# 5. Reglas de Negocio

-   Validar stock antes de confirmar.
-   Validar precios vigentes.
-   Recalcular impuestos y envío.
-   Bloquear modificaciones inconsistentes.
-   Mantener una única sesión activa por carrito.

------------------------------------------------------------------------

# 6. Backend

Implementar:

-   dominio Checkout;
-   casos de uso;
-   validaciones;
-   integración con carrito;
-   integración con inventario;
-   integración con envíos;
-   APIs públicas.

------------------------------------------------------------------------

# 7. Frontend

Crear componentes para:

-   Checkout Steps;
-   Address Form;
-   Shipping Selector;
-   Billing Form;
-   Order Summary;
-   Checkout Progress;
-   Error Recovery.

------------------------------------------------------------------------

# 8. APIs

Endpoints mínimos:

-   GET /checkout
-   POST /checkout/address
-   POST /checkout/shipping
-   POST /checkout/review
-   POST /checkout/confirm

------------------------------------------------------------------------

# 9. Rendimiento

Aplicar:

-   validaciones incrementales;
-   guardado automático;
-   actualización optimista cuando sea segura;
-   caché de datos auxiliares.

------------------------------------------------------------------------

# 10. Seguridad

Implementar:

-   validación del carrito;
-   protección CSRF cuando aplique;
-   rate limiting;
-   validación de sesión.

------------------------------------------------------------------------

# 11. Auditoría

Registrar:

-   inicio de checkout;
-   cambios de dirección;
-   selección de envío;
-   confirmación;
-   abandono cuando sea medible.

------------------------------------------------------------------------

# 12. Entregables

Claude Code deberá generar:

-   dominio Checkout;
-   esquema Prisma;
-   migraciones;
-   APIs;
-   componentes frontend;
-   integración con Cart e Inventory;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 13. Criterios de Aceptación

El módulo estará completo cuando:

-   el checkout funcione para invitados y clientes;
-   valide inventario y precios;
-   permita seleccionar envío;
-   genere una orden lista para pago.

------------------------------------------------------------------------

# 14. Definition of Done

El módulo deberá integrarse sin cambios estructurales con:

-   021 Orders
-   022 Payments
-   023 Shipping
-   024 Coupons & Promotions
