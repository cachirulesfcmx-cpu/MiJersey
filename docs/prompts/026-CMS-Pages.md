# 026 -- CMS Pages

## Engineering Specification

Version: 1.0

> Este documento define el sistema de gestión de páginas (CMS). Su
> objetivo es permitir crear y administrar contenido estático mediante
> un editor modular, con control de publicaciones, SEO y versionado.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un CMS desacoplado que permita construir páginas mediante
bloques reutilizables, facilitando la administración del contenido sin
depender del equipo de desarrollo.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Páginas estáticas.
-   Editor visual por bloques.
-   Bloques reutilizables.
-   Borradores.
-   Publicación programada.
-   Versiones.
-   SEO.
-   URLs personalizadas.
-   APIs autenticadas.

No incluye el Blog (Documento 027).

------------------------------------------------------------------------

# 3. Modelo de Dominio

## Page

Campos mínimos:

-   id
-   title
-   slug
-   status
-   template
-   seoTitle
-   seoDescription
-   publishedAt
-   createdAt
-   updatedAt

## PageBlock

Campos mínimos:

-   id
-   pageId
-   type
-   position
-   config
-   createdAt

------------------------------------------------------------------------

# 4. Reglas de Negocio

-   Cada slug deberá ser único.
-   Permitir guardar borradores sin publicar.
-   Mantener historial de versiones.
-   Soportar programación de publicación.
-   Permitir reutilizar bloques.

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   dominio CMS;
-   casos de uso;
-   versionado;
-   repositorios;
-   renderizado de bloques;
-   APIs autenticadas.

------------------------------------------------------------------------

# 6. Frontend

Crear componentes para:

-   Page Builder;
-   Block Library;
-   Page Editor;
-   Version History;
-   SEO Panel;
-   Preview Mode.

------------------------------------------------------------------------

# 7. APIs

Endpoints mínimos:

-   GET /cms/pages
-   POST /cms/pages
-   GET /cms/pages/:id
-   PATCH /cms/pages/:id
-   DELETE /cms/pages/:id
-   POST /cms/pages/:id/publish

------------------------------------------------------------------------

# 8. Rendimiento

Aplicar:

-   renderizado eficiente;
-   caché de páginas publicadas;
-   invalidación automática tras publicar;
-   carga diferida del editor.

------------------------------------------------------------------------

# 9. Seguridad

Implementar:

-   autorización por roles;
-   control de publicación;
-   auditoría de cambios;
-   validación del contenido.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   creación;
-   edición;
-   publicaciones;
-   restauración de versiones;
-   eliminación.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio CMS;
-   esquema Prisma;
-   migraciones;
-   editor visual;
-   APIs;
-   componentes frontend;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   puedan crearse páginas mediante bloques;
-   exista versionado;
-   el SEO sea configurable;
-   la publicación funcione correctamente.

------------------------------------------------------------------------

# 13. Definition of Done

El módulo deberá integrarse sin cambios estructurales con:

-   027 Blog
-   028 Navigation Builder
-   029 Theme Settings
-   031 Email Templates
