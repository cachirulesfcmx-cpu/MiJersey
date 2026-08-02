# 030 -- Site Configuration

## Engineering Specification

Version: 1.0

> Este documento define la configuración global de la tienda. Su
> propósito es centralizar los parámetros operativos, regionales y de
> infraestructura que afectan el funcionamiento del sitio.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un módulo de configuración global que permita administrar
datos generales, dominios, internacionalización, políticas e
integraciones sin modificar código.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Información general del sitio.
-   Dominios.
-   Idiomas.
-   Monedas.
-   Zona horaria.
-   Configuración regional.
-   Impuestos (configuración base).
-   Políticas legales.
-   Integraciones globales.
-   APIs autenticadas.

No incluye configuración visual del tema (Documento 029).

------------------------------------------------------------------------

# 3. Modelo de Dominio

## SiteConfiguration

Campos mínimos:

-   id
-   siteName
-   defaultDomain
-   defaultLanguage
-   defaultCurrency
-   timezone
-   locale
-   supportEmail
-   supportPhone
-   createdAt
-   updatedAt

## SystemSetting

Campos mínimos:

-   id
-   key
-   value
-   category
-   updatedAt

------------------------------------------------------------------------

# 4. Reglas de Negocio

-   Mantener una única configuración activa.
-   Validar dominios e idiomas permitidos.
-   Publicar cambios de forma controlada.
-   Invalidar cachés relacionadas cuando sea necesario.

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   dominio Site Configuration;
-   casos de uso;
-   repositorios;
-   validaciones;
-   APIs autenticadas.

------------------------------------------------------------------------

# 6. Frontend

Crear componentes para:

-   General Settings;
-   Domain Manager;
-   Language Settings;
-   Currency Settings;
-   Regional Settings;
-   Policy Manager;
-   Integration Settings.

------------------------------------------------------------------------

# 7. APIs

Endpoints mínimos:

-   GET /settings/site
-   PATCH /settings/site
-   GET /settings/system
-   PATCH /settings/system

------------------------------------------------------------------------

# 8. Rendimiento

Aplicar:

-   caché de configuración;
-   recarga selectiva;
-   invalidación automática tras cambios.

------------------------------------------------------------------------

# 9. Seguridad

Implementar:

-   autorización por roles;
-   validación de configuraciones críticas;
-   auditoría de cambios.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   cambios de configuración;
-   modificaciones de dominio;
-   cambios regionales;
-   actualización de políticas.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio Site Configuration;
-   esquema Prisma;
-   migraciones;
-   panel administrativo;
-   APIs;
-   componentes frontend;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   la configuración global pueda administrarse desde el panel;
-   los cambios se apliquen correctamente;
-   las validaciones funcionen;
-   las integraciones consuman la configuración activa.

------------------------------------------------------------------------

# 13. Definition of Done

El módulo deberá integrarse sin cambios estructurales con:

-   022 Payments
-   023 Shipping
-   029 Theme Settings
-   031 Email Templates
-   034 Notifications
