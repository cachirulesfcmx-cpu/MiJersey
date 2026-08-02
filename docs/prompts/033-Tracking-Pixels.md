# 033 -- Tracking & Pixels

## Engineering Specification

Version: 1.0

> Este documento define la capa de medición del sitio. Su propósito es
> centralizar la integración con plataformas de analítica, publicidad y
> atribución mediante una arquitectura desacoplada y respetuosa de la
> privacidad.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un módulo de Tracking que administre etiquetas, píxeles y
eventos para marketing, analítica y optimización de campañas.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Google Analytics 4.
-   Google Tag Manager.
-   Meta Pixel.
-   TikTok Pixel.
-   Conversion API (preparado para múltiples proveedores).
-   Eventos personalizados.
-   Consentimiento de cookies.
-   Gestión centralizada de etiquetas.
-   APIs autenticadas.

No incluye automatización de campañas publicitarias.

------------------------------------------------------------------------

# 3. Modelo de Dominio

## TrackingProvider

Campos mínimos:

-   id
-   provider
-   status
-   configuration
-   createdAt
-   updatedAt

## TrackingEvent

Campos mínimos:

-   id
-   eventName
-   source
-   payload
-   consentRequired
-   createdAt

------------------------------------------------------------------------

# 4. Reglas de Negocio

-   Respetar el consentimiento del usuario antes de activar etiquetas
    cuando aplique.
-   Evitar eventos duplicados.
-   Permitir múltiples proveedores simultáneamente.
-   Centralizar el mapeo de eventos del negocio.

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   dominio Tracking;
-   gestor de proveedores;
-   despachador de eventos;
-   repositorios;
-   APIs autenticadas.

------------------------------------------------------------------------

# 6. Frontend

Crear componentes para:

-   Tracking Dashboard;
-   Provider Manager;
-   Event Mapper;
-   Consent Banner;
-   Consent Preferences;
-   Debug Console.

------------------------------------------------------------------------

# 7. APIs

Endpoints mínimos:

-   GET /tracking/providers
-   PATCH /tracking/providers/:id
-   GET /tracking/events
-   POST /tracking/events/test
-   GET /tracking/consent

------------------------------------------------------------------------

# 8. Rendimiento

Aplicar:

-   carga diferida de scripts;
-   envío asíncrono de eventos;
-   deduplicación;
-   batching cuando corresponda.

------------------------------------------------------------------------

# 9. Seguridad

Implementar:

-   autorización por roles;
-   protección de credenciales;
-   validación de configuraciones;
-   cumplimiento de políticas de privacidad.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   cambios de configuración;
-   altas y bajas de proveedores;
-   pruebas de eventos;
-   modificaciones del consentimiento.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio Tracking;
-   esquema Prisma;
-   migraciones;
-   panel de administración;
-   APIs;
-   componentes frontend;
-   integración con Analytics;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   los proveedores puedan configurarse;
-   los eventos se envíen correctamente;
-   el consentimiento se respete;
-   la depuración de eventos sea posible.

------------------------------------------------------------------------

# 13. Definition of Done

El módulo deberá integrarse sin cambios estructurales con:

-   013 Storefront Home
-   018 Checkout
-   022 Payments
-   032 Analytics
-   034 Notifications
