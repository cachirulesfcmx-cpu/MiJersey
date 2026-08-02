# 028 -- Navigation Builder

## Engineering Specification

Version: 1.0

> Este documento define el constructor de navegación del sitio. Su
> propósito es administrar de forma centralizada todos los menús y
> estructuras de navegación mediante un sistema flexible, jerárquico y
> reutilizable.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un Navigation Builder desacoplado que permita crear,
organizar y publicar múltiples menús con soporte para mega menús,
enlaces dinámicos y reglas de visibilidad.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Menús jerárquicos.
-   Mega menús.
-   Múltiples ubicaciones.
-   Enlaces internos y externos.
-   Enlaces dinámicos a categorías, colecciones, marcas, productos y
    páginas.
-   Orden mediante drag & drop.
-   Visibilidad por contexto.
-   Versionado.
-   APIs autenticadas.

No incluye personalización visual del tema.

------------------------------------------------------------------------

# 3. Modelo de Dominio

## NavigationMenu

Campos mínimos:

-   id
-   name
-   location
-   status
-   createdAt
-   updatedAt

## NavigationItem

Campos mínimos:

-   id
-   menuId
-   parentId
-   label
-   type
-   target
-   icon
-   sortOrder
-   visibilityRules
-   openInNewTab
-   createdAt
-   updatedAt

------------------------------------------------------------------------

# 4. Reglas de Negocio

-   Soportar profundidad configurable de niveles.
-   Validar referencias a recursos internos.
-   Mantener consistencia al eliminar recursos enlazados.
-   Permitir múltiples menús activos por ubicación cuando exista
    segmentación.

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   dominio Navigation;
-   casos de uso;
-   repositorios;
-   renderizado de árboles;
-   versionado;
-   APIs autenticadas.

------------------------------------------------------------------------

# 6. Frontend

Crear componentes para:

-   Navigation Builder;
-   Tree Editor;
-   Mega Menu Editor;
-   Link Picker;
-   Visibility Rules Editor;
-   Live Preview.

------------------------------------------------------------------------

# 7. APIs

Endpoints mínimos:

-   GET /navigation/menus
-   POST /navigation/menus
-   PATCH /navigation/menus/:id
-   DELETE /navigation/menus/:id
-   GET /navigation/render/:location

------------------------------------------------------------------------

# 8. Rendimiento

Aplicar:

-   caché de menús publicados;
-   consultas optimizadas;
-   renderizado eficiente del árbol;
-   invalidación automática tras cambios.

------------------------------------------------------------------------

# 9. Seguridad

Implementar:

-   autorización por roles;
-   validación de referencias;
-   auditoría de cambios.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   creación y edición de menús;
-   cambios de estructura;
-   publicaciones;
-   restauración de versiones.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio Navigation;
-   esquema Prisma;
-   migraciones;
-   editor de menús;
-   APIs;
-   componentes frontend;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   permita administrar múltiples menús;
-   soporte mega menús y jerarquías;
-   renderice correctamente la navegación;
-   las reglas de visibilidad funcionen según lo esperado.

------------------------------------------------------------------------

# 13. Definition of Done

El módulo deberá integrarse sin cambios estructurales con:

-   013 Storefront Home
-   026 CMS Pages
-   027 Blog
-   029 Theme Settings
