# 029 -- Theme Settings

## Engineering Specification

Version: 1.0

> Este documento define el módulo de configuración del tema. Su
> propósito es permitir personalizar la apariencia y el comportamiento
> global del storefront sin modificar código.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un sistema centralizado de Theme Settings que controle
identidad visual, layouts, componentes globales y variables de diseño.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Logo e identidad visual.
-   Paleta de colores.
-   Tipografía.
-   Variables de diseño.
-   Header.
-   Footer.
-   Banners globales.
-   Layouts.
-   Configuración responsive.
-   APIs autenticadas.

No incluye edición de contenido (CMS).

------------------------------------------------------------------------

# 3. Modelo de Dominio

## ThemeSettings

Campos mínimos:

-   id
-   siteName
-   logo
-   favicon
-   primaryColor
-   secondaryColor
-   typography
-   borderRadius
-   spacingScale
-   createdAt
-   updatedAt

## ThemeSection

Campos mínimos:

-   id
-   section
-   config
-   enabled
-   updatedAt

------------------------------------------------------------------------

# 4. Reglas de Negocio

-   Mantener una configuración activa por sitio.
-   Validar formatos de colores e imágenes.
-   Publicar cambios de forma controlada.
-   Invalidar caché tras cambios.

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   dominio Theme;
-   casos de uso;
-   repositorios;
-   versionado de configuración;
-   APIs autenticadas.

------------------------------------------------------------------------

# 6. Frontend

Crear componentes para:

-   Theme Dashboard;
-   Color Picker;
-   Typography Settings;
-   Header Editor;
-   Footer Editor;
-   Banner Manager;
-   Live Preview.

------------------------------------------------------------------------

# 7. APIs

Endpoints mínimos:

-   GET /theme
-   PATCH /theme
-   GET /theme/preview
-   POST /theme/publish

------------------------------------------------------------------------

# 8. Rendimiento

Aplicar:

-   caché de configuración;
-   CSS variables;
-   invalidación selectiva;
-   carga eficiente de recursos.

------------------------------------------------------------------------

# 9. Seguridad

Implementar:

-   autorización por roles;
-   validación de archivos;
-   auditoría de cambios.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   cambios de identidad;
-   publicaciones;
-   restauraciones;
-   modificaciones de layouts.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio Theme;
-   esquema Prisma;
-   migraciones;
-   panel de configuración;
-   APIs;
-   componentes frontend;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   la configuración pueda modificarse sin código;
-   exista vista previa;
-   los cambios se publiquen correctamente;
-   el storefront refleje la configuración activa.

------------------------------------------------------------------------

# 13. Definition of Done

El módulo deberá integrarse sin cambios estructurales con:

-   013 Storefront Home
-   026 CMS Pages
-   028 Navigation Builder
-   030 Site Configuration
