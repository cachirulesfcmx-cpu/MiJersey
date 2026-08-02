# 034 -- Notifications

## Engineering Specification

Version: 1.0

> Este documento define el sistema unificado de notificaciones. Su
> propósito es gestionar el envío de comunicaciones transaccionales
> mediante múltiples canales de forma confiable, escalable y auditable.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un módulo de notificaciones desacoplado con soporte para
múltiples canales, colas de procesamiento, preferencias del usuario y
seguimiento de entregas.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Correo electrónico.
-   SMS.
-   WhatsApp.
-   Notificaciones Push.
-   Centro de notificaciones.
-   Preferencias del usuario.
-   Colas.
-   Reintentos automáticos.
-   Seguimiento de entregas.
-   APIs autenticadas.

No incluye campañas de marketing masivo.

------------------------------------------------------------------------

# 3. Modelo de Dominio

## Notification

Campos mínimos:

-   id
-   channel
-   templateKey
-   recipient
-   status
-   payload
-   queuedAt
-   sentAt
-   deliveredAt
-   failedAt
-   createdAt

## NotificationPreference

Campos mínimos:

-   id
-   customerId
-   channel
-   enabled
-   updatedAt

------------------------------------------------------------------------

# 4. Reglas de Negocio

-   Respetar las preferencias del usuario.
-   Soportar múltiples canales para un mismo evento.
-   Reintentar envíos fallidos según políticas configurables.
-   Evitar envíos duplicados mediante idempotencia.
-   Registrar todo el ciclo de vida de cada notificación.

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   dominio Notifications;
-   gestor de canales;
-   cola de procesamiento;
-   reintentos;
-   repositorios;
-   integración con Email Templates;
-   APIs autenticadas.

------------------------------------------------------------------------

# 6. Frontend

Crear componentes para:

-   Notification Center;
-   Preferences Manager;
-   Delivery Status;
-   Notification Timeline;
-   Retry Manager;
-   Admin Dashboard.

------------------------------------------------------------------------

# 7. APIs

Endpoints mínimos:

-   GET /notifications
-   GET /notifications/preferences
-   PATCH /notifications/preferences
-   POST /notifications/test
-   POST /notifications/retry/:id

------------------------------------------------------------------------

# 8. Rendimiento

Aplicar:

-   procesamiento asíncrono;
-   colas distribuidas;
-   batching cuando aplique;
-   consultas indexadas;
-   monitoreo de latencia.

------------------------------------------------------------------------

# 9. Seguridad

Implementar:

-   autorización por roles;
-   protección de credenciales de proveedores;
-   cifrado de datos sensibles;
-   auditoría de accesos.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   envíos;
-   reintentos;
-   entregas;
-   errores;
-   cambios de preferencias;
-   pruebas realizadas.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio Notifications;
-   esquema Prisma;
-   migraciones;
-   gestor de canales;
-   APIs;
-   componentes frontend;
-   integración con Email Templates, Orders y Customer Service;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   las notificaciones se envíen correctamente;
-   los reintentos funcionen;
-   las preferencias del usuario se respeten;
-   exista trazabilidad completa de las entregas.

------------------------------------------------------------------------

# 13. Definition of Done

El módulo deberá integrarse sin cambios estructurales con:

-   021 Orders
-   022 Payments
-   023 Shipping
-   025 Customer Service
-   031 Email Templates
-   032 Analytics
-   033 Tracking & Pixels
-   035 Production Hardening
