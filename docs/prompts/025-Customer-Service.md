# 025 -- Customer Service

## Engineering Specification

Version: 1.0

> Este documento define el módulo de Atención al Cliente. Su propósito
> es centralizar la gestión de incidencias, solicitudes, devoluciones y
> comunicación con los clientes, proporcionando trazabilidad, SLA y
> herramientas de autoservicio.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un sistema de Customer Service desacoplado que permita
gestionar tickets, devoluciones (RMA), consultas y seguimiento de
incidencias, integrado con pedidos, envíos y notificaciones.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Creación de tickets.
-   Gestión de estados.
-   Asignación a agentes.
-   Notas internas.
-   Respuestas al cliente.
-   Adjuntos.
-   Historial de conversaciones.
-   Devoluciones (RMA) preparadas.
-   SLA.
-   APIs autenticadas.

No incluye chat en tiempo real.

------------------------------------------------------------------------

# 3. Modelo de Dominio

## Ticket

Campos mínimos:

-   id
-   ticketNumber
-   customerId
-   orderId (opcional)
-   subject
-   category
-   priority
-   status
-   assignedAgentId
-   createdAt
-   updatedAt
-   closedAt

## TicketMessage

Campos mínimos:

-   id
-   ticketId
-   authorType
-   authorId
-   message
-   attachments
-   createdAt

------------------------------------------------------------------------

# 4. Reglas de Negocio

-   Cada ticket tendrá un historial completo.
-   Solo usuarios autorizados podrán ver notas internas.
-   Los clientes solo accederán a sus propios tickets.
-   Las respuestas deberán actualizar el estado cuando corresponda.
-   Preparar integración con devoluciones (RMA).

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   dominio Customer Service;
-   casos de uso;
-   repositorios;
-   gestión de SLA;
-   integración con Orders, Shipping y Notifications;
-   APIs autenticadas.

------------------------------------------------------------------------

# 6. Frontend

Crear componentes para:

-   Customer Support Dashboard;
-   Ticket List;
-   Ticket Detail;
-   Conversation Timeline;
-   Reply Editor;
-   Attachment Viewer;
-   SLA Indicators.

------------------------------------------------------------------------

# 7. APIs

Endpoints mínimos:

-   GET /support/tickets
-   POST /support/tickets
-   GET /support/tickets/:id
-   POST /support/tickets/:id/reply
-   PATCH /support/tickets/:id
-   POST /support/rma

------------------------------------------------------------------------

# 8. Rendimiento

Aplicar:

-   paginación;
-   consultas indexadas;
-   carga diferida de conversaciones;
-   almacenamiento eficiente de adjuntos.

------------------------------------------------------------------------

# 9. Seguridad

Implementar:

-   autenticación obligatoria;
-   autorización por propietario y roles;
-   validación de adjuntos;
-   registro de auditoría.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   creación de tickets;
-   cambios de estado;
-   asignaciones;
-   respuestas;
-   cierres;
-   solicitudes de devolución.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio Customer Service;
-   esquema Prisma;
-   migraciones;
-   APIs;
-   componentes frontend;
-   integración con Orders, Shipping y Notifications;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   los clientes puedan crear y consultar tickets;
-   los agentes administren incidencias;
-   exista trazabilidad completa;
-   los SLA puedan medirse;
-   las integraciones funcionen correctamente.

------------------------------------------------------------------------

# 13. Definition of Done

El módulo deberá integrarse sin cambios estructurales con:

-   019 Customer Account
-   021 Orders
-   023 Shipping
-   031 Email Templates
-   034 Notifications
