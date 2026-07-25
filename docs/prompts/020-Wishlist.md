# 020 -- Wishlist

## Engineering Specification

Version: 1.0

> Este documento define el sistema de Lista de Deseos (Wishlist). Su
> objetivo es permitir que los clientes guarden productos para
> comprarlos posteriormente y sincronizar esta información entre
> dispositivos.

------------------------------------------------------------------------

# 1. Objetivo

Implementar una Wishlist persistente, segura y sincronizada, integrada
con catálogo, inventario y carrito de compras.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Agregar y eliminar productos.
-   Soporte para variantes.
-   Sincronización entre dispositivos.
-   Compartir listas mediante enlace.
-   Mover productos al carrito.
-   Notificaciones de disponibilidad (preparado para integración).
-   APIs autenticadas.

No incluye listas colaborativas.

------------------------------------------------------------------------

# 3. Modelo de Dominio

## Wishlist

Campos mínimos:

-   id
-   customerId
-   name
-   isDefault
-   createdAt
-   updatedAt

## WishlistItem

Campos mínimos:

-   id
-   wishlistId
-   productId
-   variantId
-   createdAt

------------------------------------------------------------------------

# 4. Reglas de Negocio

-   Cada cliente tendrá al menos una Wishlist predeterminada.
-   No permitir elementos duplicados en la misma lista.
-   Si un producto deja de existir, deberá marcarse como no disponible.
-   Mantener la Wishlist al cambiar de dispositivo o iniciar sesión.

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   dominio Wishlist;
-   casos de uso;
-   repositorios;
-   integración con Catálogo, Inventario y Carrito;
-   APIs autenticadas.

------------------------------------------------------------------------

# 6. Frontend

Crear componentes reutilizables para:

-   Wishlist Page;
-   Wishlist Button;
-   Wishlist Item;
-   Empty Wishlist;
-   Share Wishlist;
-   Move To Cart.

------------------------------------------------------------------------

# 7. APIs

Endpoints mínimos:

-   GET /wishlist
-   POST /wishlist/items
-   DELETE /wishlist/items/:id
-   POST /wishlist/items/:id/move-to-cart
-   POST /wishlist/share

------------------------------------------------------------------------

# 8. Rendimiento

Preparar:

-   consultas optimizadas;
-   caché cuando corresponda;
-   actualización optimista;
-   carga diferida de imágenes.

------------------------------------------------------------------------

# 9. Seguridad

Aplicar:

-   autenticación obligatoria;
-   autorización por propietario;
-   validación de enlaces compartidos.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   creación de listas;
-   eliminación de productos;
-   productos movidos al carrito;
-   enlaces compartidos.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio Wishlist;
-   esquema Prisma;
-   migraciones;
-   APIs;
-   componentes frontend;
-   integración con Cart e Inventory;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   la Wishlist persista correctamente;
-   sincronice entre dispositivos;
-   permita mover productos al carrito;
-   gestione variantes correctamente.

------------------------------------------------------------------------

# 13. Definition of Done

El módulo deberá integrarse sin cambios estructurales con:

-   017 Shopping Cart
-   019 Customer Account
-   021 Orders
-   032 Analytics
