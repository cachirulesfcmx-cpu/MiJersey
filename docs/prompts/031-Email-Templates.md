# 031 -- Email Templates

## Engineering Specification

Version: 1.0

> Este documento define el sistema de plantillas de correo electrónico.
> Su propósito es centralizar la generación de emails transaccionales
> mediante plantillas reutilizables, versionadas e internacionalizadas.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un módulo de Email Templates desacoplado que permita
diseñar, administrar y publicar plantillas reutilizables con variables
dinámicas e integración con los distintos módulos del sistema.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Plantillas transaccionales.
-   Layouts reutilizables.
-   Variables dinámicas.
-   Editor visual.
-   Vista previa.
-   Versionado.
-   Internacionalización.
-   Pruebas de envío.
-   APIs autenticadas.

No incluye campañas de marketing masivo.

------------------------------------------------------------------------

# 3. Modelo de Dominio

## EmailTemplate

Campos mínimos:

-   id
-   name
-   key
-   language
-   subject
-   html
-   text
-   status
-   version
-   createdAt
-   updatedAt

## EmailLayout

Campos mínimos:

-   id
-   name
-   html
-   css
-   createdAt
-   updatedAt

------------------------------------------------------------------------

# 4. Reglas de Negocio

-   Cada plantilla tendrá una clave única.
-   Soportar múltiples idiomas.
-   Mantener historial de versiones.
-   Validar variables antes de publicar.
-   Permitir reutilizar layouts.

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   dominio Email Templates;
-   casos de uso;
-   renderizado de variables;
-   versionado;
-   repositorios;
-   APIs autenticadas.

------------------------------------------------------------------------

# 6. Frontend

Crear componentes para:

-   Template Editor;
-   Layout Editor;
-   Variable Inspector;
-   Email Preview;
-   Version History;
-   Test Send.

------------------------------------------------------------------------

# 7. APIs

Endpoints mínimos:

-   GET /email/templates
-   POST /email/templates
-   PATCH /email/templates/:id
-   POST /email/templates/:id/test
-   POST /email/templates/:id/publish

------------------------------------------------------------------------

# 8. Rendimiento

Aplicar:

-   caché de plantillas publicadas;
-   compilación eficiente;
-   reutilización de layouts.

------------------------------------------------------------------------

# 9. Seguridad

Implementar:

-   autorización por roles;
-   sanitización del HTML;
-   auditoría de cambios;
-   protección de credenciales SMTP o proveedores.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   creación;
-   edición;
-   publicaciones;
-   pruebas de envío;
-   restauración de versiones.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio Email Templates;
-   esquema Prisma;
-   migraciones;
-   editor visual;
-   APIs;
-   componentes frontend;
-   integración con Notifications;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   las plantillas puedan editarse y versionarse;
-   las variables se rendericen correctamente;
-   la vista previa sea precisa;
-   las pruebas de envío funcionen.

------------------------------------------------------------------------

# 13. Definition of Done

El módulo deberá integrarse sin cambios estructurales con:

-   021 Orders
-   022 Payments
-   025 Customer Service
-   034 Notifications
