# 009 -- Inventory

## Engineering Specification

Version: 1.0

> Este documento define el sistema de inventario de la plataforma. Su
> propósito es controlar la disponibilidad de cada variante de producto,
> registrar movimientos y mantener la consistencia del stock durante
> todo el ciclo de venta.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un sistema de inventario preciso, auditable y escalable que
soporte múltiples almacenes en el futuro, reservas de stock y
sincronización con pedidos.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Inventario por variante.
-   Stock disponible y reservado.
-   Movimientos de inventario.
-   Ajustes manuales.
-   Reserva y liberación de stock.
-   Historial de movimientos.
-   APIs administrativas.

No incluye logística de envíos (Documento 023).

------------------------------------------------------------------------

# 3. Modelo de Dominio

## InventoryItem

Campos mínimos:

-   id
-   variantId
-   warehouseId
-   availableQuantity
-   reservedQuantity
-   incomingQuantity
-   safetyStock
-   updatedAt

## InventoryMovement

Campos mínimos:

-   id
-   inventoryItemId
-   type
-   quantity
-   reason
-   referenceType
-   referenceId
-   createdBy
-   createdAt

## Warehouse

Campos mínimos:

-   id
-   code
-   name
-   status

------------------------------------------------------------------------

# 4. Tipos de Movimiento

Soportar:

-   Entrada
-   Salida
-   Reserva
-   Liberación
-   Ajuste positivo
-   Ajuste negativo
-   Devolución

Todo movimiento deberá ser inmutable.

------------------------------------------------------------------------

# 5. Reglas de Negocio

-   Nunca permitir stock negativo salvo configuración explícita.
-   Cada variante tendrá su propio inventario.
-   Las reservas reducirán el stock disponible.
-   Cancelaciones liberarán reservas.
-   Confirmaciones de pedido convertirán reservas en salidas.

------------------------------------------------------------------------

# 6. Backend

Implementar:

-   entidades InventoryItem, InventoryMovement y Warehouse;
-   casos de uso;
-   repositorios;
-   validaciones;
-   servicios de reserva;
-   servicios de ajuste;
-   APIs administrativas.

------------------------------------------------------------------------

# 7. Frontend Administrativo

Interfaces para:

-   consulta de inventario;
-   ajustes manuales;
-   historial de movimientos;
-   filtros;
-   búsqueda;
-   acciones masivas.

------------------------------------------------------------------------

# 8. APIs

Endpoints mínimos:

-   GET /inventory
-   GET /inventory/:variantId
-   POST /inventory/adjust
-   POST /inventory/reserve
-   POST /inventory/release
-   GET /inventory/movements

------------------------------------------------------------------------

# 9. Rendimiento

Preparar:

-   consultas indexadas;
-   paginación;
-   filtros por almacén;
-   operaciones transaccionales;
-   bloqueo optimista o estrategia equivalente para evitar
    inconsistencias.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   ajustes;
-   reservas;
-   liberaciones;
-   cambios de almacén;
-   modificaciones administrativas.

Ningún movimiento podrá eliminarse físicamente.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio Inventory;
-   dominio Warehouse;
-   esquema Prisma;
-   migraciones;
-   CRUD de almacenes;
-   motor de movimientos;
-   sistema de reservas;
-   interfaces administrativas;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   el stock refleje correctamente las operaciones;
-   las reservas funcionen;
-   los movimientos sean auditables;
-   el panel permita administrar existencias de forma segura.

------------------------------------------------------------------------

# 13. Definition of Done

El sistema deberá integrarse sin cambios estructurales con:

-   017 Shopping Cart
-   018 Checkout
-   021 Orders
-   023 Shipping

garantizando consistencia del inventario durante todo el flujo de
compra.
