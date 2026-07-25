# 019 -- Customer Account

## Engineering Specification

Version: 1.0

> Este documento define el área privada del cliente. Su propósito es
> ofrecer un espacio seguro donde el usuario pueda administrar su
> información personal, pedidos y preferencias.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un portal de cliente completo, integrado con el sistema de
identidad, pedidos y carrito, priorizando seguridad, autoservicio y
buena experiencia de usuario.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Perfil.
-   Datos personales.
-   Direcciones.
-   Historial de pedidos.
-   Estado de pedidos.
-   Recompras.
-   Gestión de sesiones.
-   Cambio de contraseña.
-   Preferencias.
-   APIs públicas autenticadas.

No incluye soporte al cliente (Documento 025).

------------------------------------------------------------------------

# 3. Funcionalidades

Permitir:

-   editar perfil;
-   administrar direcciones;
-   consultar pedidos;
-   descargar comprobantes cuando existan;
-   volver a comprar;
-   administrar sesiones activas;
-   cambiar contraseña.

------------------------------------------------------------------------

# 4. Modelo de Dominio

## CustomerProfile

Campos mínimos:

-   id
-   userId
-   firstName
-   lastName
-   phone
-   preferences
-   createdAt
-   updatedAt

## Address

Campos mínimos:

-   id
-   customerId
-   type
-   firstName
-   lastName
-   company
-   addressLine1
-   addressLine2
-   city
-   state
-   postalCode
-   country
-   phone
-   isDefault

------------------------------------------------------------------------

# 5. Reglas de Negocio

-   Un cliente podrá tener múltiples direcciones.
-   Existirá una dirección predeterminada por tipo.
-   Solo el propietario podrá acceder a su información.
-   La actualización del perfil no deberá afectar pedidos históricos.

------------------------------------------------------------------------

# 6. Backend

Implementar:

-   dominio Customer;
-   casos de uso;
-   repositorios;
-   validaciones;
-   integración con Identity y Orders;
-   APIs autenticadas.

------------------------------------------------------------------------

# 7. Frontend

Crear componentes para:

-   Dashboard;
-   Profile Form;
-   Address Book;
-   Order History;
-   Order Detail;
-   Security Settings;
-   Sessions Manager.

------------------------------------------------------------------------

# 8. APIs

Endpoints mínimos:

-   GET /me
-   PATCH /me
-   GET /me/addresses
-   POST /me/addresses
-   PATCH /me/addresses/:id
-   DELETE /me/addresses/:id
-   GET /me/orders

------------------------------------------------------------------------

# 9. Rendimiento

Preparar:

-   carga diferida del historial;
-   paginación;
-   caché de datos no sensibles;
-   consultas optimizadas.

------------------------------------------------------------------------

# 10. Seguridad

Aplicar:

-   autenticación obligatoria;
-   autorización por propietario;
-   validación de sesión;
-   auditoría de cambios críticos.

------------------------------------------------------------------------

# 11. Auditoría

Registrar:

-   cambios de perfil;
-   cambios de direcciones;
-   cambio de contraseña;
-   cierre de sesiones;
-   actualización de preferencias.

------------------------------------------------------------------------

# 12. Entregables

Claude Code deberá generar:

-   dominio Customer;
-   esquema Prisma;
-   migraciones;
-   APIs;
-   portal del cliente;
-   integración con Orders e Identity;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 13. Criterios de Aceptación

El módulo estará completo cuando:

-   el cliente pueda administrar su perfil;
-   gestionar direcciones;
-   consultar pedidos;
-   administrar la seguridad de su cuenta;
-   acceder desde dispositivos móviles y escritorio.

------------------------------------------------------------------------

# 14. Definition of Done

El módulo deberá integrarse sin cambios estructurales con:

-   020 Wishlist
-   021 Orders
-   022 Payments
-   023 Shipping
-   025 Customer Service
