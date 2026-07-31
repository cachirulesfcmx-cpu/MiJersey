# 024 -- Coupons & Promotions

## Engineering Specification

Version: 1.0

> Este documento define el motor de Cupones y Promociones. Su propósito
> es administrar descuentos y campañas de forma flexible, auditable y
> escalable.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un motor de promociones desacoplado capaz de evaluar reglas
complejas y aplicar descuentos consistentes durante el carrito, checkout
y procesamiento de órdenes.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Cupones manuales.
-   Descuentos automáticos.
-   Promociones por producto.
-   Promociones por categoría.
-   Promociones por marca.
-   Reglas por cliente.
-   Reglas por importe mínimo.
-   Límite de usos.
-   Prioridades.
-   Compatibilidad entre promociones.
-   APIs autenticadas.

No incluye programas de lealtad.

------------------------------------------------------------------------

# 3. Modelo de Dominio

## Promotion

Campos mínimos:

-   id
-   name
-   code
-   type
-   status
-   priority
-   startsAt
-   endsAt
-   usageLimit
-   usageCount
-   stackable
-   createdAt
-   updatedAt

## PromotionRule

Campos mínimos:

-   id
-   promotionId
-   ruleType
-   operator
-   value

------------------------------------------------------------------------

# 4. Reglas de Negocio

-   Validar vigencia.
-   Validar elegibilidad.
-   Respetar prioridades.
-   Permitir promociones acumulables cuando corresponda.
-   Evitar descuentos duplicados.
-   Registrar cada uso de un cupón.

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   dominio Promotions;
-   motor de reglas;
-   evaluador de descuentos;
-   repositorios;
-   integración con Cart, Checkout y Orders;
-   APIs.

------------------------------------------------------------------------

# 6. Frontend

Crear componentes para:

-   Coupon Box;
-   Promotion Banner;
-   Discount Summary;
-   Promotion Manager;
-   Usage Dashboard.

------------------------------------------------------------------------

# 7. APIs

Endpoints mínimos:

-   GET /promotions
-   POST /promotions
-   PATCH /promotions/:id
-   DELETE /promotions/:id
-   POST /promotions/validate

------------------------------------------------------------------------

# 8. Rendimiento

Aplicar:

-   evaluación eficiente de reglas;
-   caché de promociones activas;
-   consultas indexadas;
-   procesamiento optimizado para alto volumen.

------------------------------------------------------------------------

# 9. Seguridad

Implementar:

-   autorización por roles;
-   validación de códigos;
-   protección contra abuso y reutilización indebida.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   creación y edición de promociones;
-   uso de cupones;
-   rechazos por reglas;
-   expiraciones.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio Promotions;
-   esquema Prisma;
-   migraciones;
-   motor de reglas;
-   APIs;
-   componentes frontend;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   aplique correctamente promociones automáticas;
-   valide cupones;
-   respete prioridades y compatibilidad;
-   registre el uso de descuentos.

------------------------------------------------------------------------

# 13. Definition of Done

El módulo deberá integrarse sin cambios estructurales con:

-   017 Shopping Cart
-   018 Checkout
-   021 Orders
-   022 Payments
-   032 Analytics
