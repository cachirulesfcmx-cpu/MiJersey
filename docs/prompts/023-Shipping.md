# 023 -- Shipping

## Engineering Specification

Version: 1.0

> Este documento define el módulo de Envíos. Su propósito es gestionar
> el cálculo de tarifas, selección de transportistas, generación de
> envíos y seguimiento de pedidos de forma escalable.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un sistema de envíos desacoplado que soporte múltiples
transportistas, reglas de negocio, zonas de cobertura y seguimiento del
cumplimiento de pedidos.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Métodos de envío.
-   Transportistas.
-   Tarifas.
-   Zonas de envío.
-   Reglas de cálculo.
-   Generación de guías (preparado para integración).
-   Seguimiento.
-   Estimación de entrega.
-   APIs internas y autenticadas.

No incluye logística inversa (preparado para futura integración).

------------------------------------------------------------------------

# 3. Modelo de Dominio

## Shipment

Campos mínimos:

-   id
-   orderId
-   carrier
-   service
-   trackingNumber
-   labelUrl
-   status
-   shippedAt
-   deliveredAt
-   createdAt
-   updatedAt

## ShippingMethod

Campos mínimos:

-   id
-   name
-   carrier
-   zone
-   basePrice
-   estimatedDays
-   active

------------------------------------------------------------------------

# 4. Reglas de Negocio

-   Calcular tarifas según zona, peso, dimensiones y reglas
    configurables.
-   Validar disponibilidad del método de envío.
-   Permitir múltiples transportistas.
-   Actualizar estados mediante eventos de seguimiento.

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   dominio Shipping;
-   casos de uso;
-   repositorios;
-   motor de cálculo de tarifas;
-   adaptadores de transportistas;
-   APIs.

------------------------------------------------------------------------

# 6. Frontend

Crear componentes para:

-   Shipping Method Selector;
-   Shipping Estimator;
-   Shipment Tracking;
-   Shipping Status;
-   Shipping Configuration (administración).

------------------------------------------------------------------------

# 7. APIs

Endpoints mínimos:

-   GET /shipping/methods
-   POST /shipping/rates
-   POST /shipping/shipments
-   GET /shipping/track/:trackingNumber

------------------------------------------------------------------------

# 8. Rendimiento

Aplicar:

-   caché de tarifas;
-   consultas indexadas;
-   procesamiento asíncrono para integración con transportistas;
-   reintentos ante fallos temporales.

------------------------------------------------------------------------

# 9. Seguridad

Implementar:

-   autenticación para operaciones administrativas;
-   validación de webhooks cuando existan;
-   control de acceso por roles.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   creación de envíos;
-   cambios de estado;
-   generación de guías;
-   incidencias de transporte.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio Shipping;
-   esquema Prisma;
-   migraciones;
-   adaptadores de transportistas;
-   APIs;
-   componentes frontend;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   calcule correctamente las tarifas;
-   permita seleccionar métodos de envío;
-   gestione el seguimiento de pedidos;
-   se integre con Checkout y Orders.

------------------------------------------------------------------------

# 13. Definition of Done

El módulo deberá integrarse sin cambios estructurales con:

-   018 Checkout
-   021 Orders
-   022 Payments
-   024 Coupons & Promotions
-   034 Notifications
