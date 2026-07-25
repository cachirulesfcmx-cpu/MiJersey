# 017 -- Shopping Cart

## Engineering Specification

Version: 1.0

> Este documento define el sistema de carrito de compras. Su propósito
> es mantener una experiencia de compra consistente, persistente y
> sincronizada con el inventario y el proceso de checkout.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un carrito robusto que permita agregar, modificar y eliminar
productos, conservar el estado entre sesiones y preparar correctamente
la información para el checkout.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Carrito para invitados y clientes.
-   Persistencia entre sesiones.
-   Sincronización al iniciar sesión.
-   Variantes de producto.
-   Cantidades.
-   Cupones.
-   Cálculo de subtotales.
-   Estimación de envío.
-   APIs públicas.

No incluye el proceso de pago (Documento 022).

------------------------------------------------------------------------

# 3. Modelo de Dominio

## Cart

Campos mínimos:

-   id
-   customerId (opcional)
-   sessionId
-   currency
-   status
-   createdAt
-   updatedAt

## CartItem

Campos mínimos:

-   id
-   cartId
-   productId
-   variantId
-   sku
-   quantity
-   unitPrice
-   subtotal

------------------------------------------------------------------------

# 4. Reglas de Negocio

-   Un cliente tendrá un carrito activo.
-   Los invitados utilizarán un carrito asociado a sesión.
-   Validar inventario antes de confirmar cambios.
-   Recalcular automáticamente totales.
-   No permitir cantidades inválidas.
-   Fusionar carritos al iniciar sesión.

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   dominio Cart;
-   casos de uso;
-   repositorios;
-   cálculo de totales;
-   integración con inventario;
-   APIs públicas.

------------------------------------------------------------------------

# 6. Frontend

Crear componentes reutilizables para:

-   Mini Cart;
-   Cart Drawer;
-   Cart Page;
-   Cart Item;
-   Coupon Box;
-   Order Summary;
-   Shipping Estimator.

------------------------------------------------------------------------

# 7. APIs

Endpoints mínimos:

-   GET /cart
-   POST /cart/items
-   PATCH /cart/items/:id
-   DELETE /cart/items/:id
-   POST /cart/coupon
-   POST /cart/merge

------------------------------------------------------------------------

# 8. Rendimiento

Preparar:

-   actualización optimista;
-   sincronización eficiente;
-   caché de consultas;
-   validaciones transaccionales.

------------------------------------------------------------------------

# 9. Auditoría

Registrar:

-   aplicación y eliminación de cupones;
-   fusión de carritos;
-   cambios relevantes cuando correspondan.

------------------------------------------------------------------------

# 10. Entregables

Claude Code deberá generar:

-   dominio Cart;
-   esquema Prisma;
-   migraciones;
-   APIs;
-   componentes frontend;
-   integración con inventario;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 11. Criterios de Aceptación

El módulo estará completo cuando:

-   el carrito persista correctamente;
-   las cantidades se validen;
-   el inventario se sincronice;
-   los totales sean consistentes;
-   la experiencia funcione para invitados y clientes.

------------------------------------------------------------------------

# 12. Definition of Done

El sistema deberá integrarse sin cambios estructurales con:

-   018 Checkout
-   021 Orders
-   022 Payments
-   023 Shipping
-   024 Coupons & Promotions
