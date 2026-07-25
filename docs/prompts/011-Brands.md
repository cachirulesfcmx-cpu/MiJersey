# 011 -- Brands

## Engineering Specification

Version: 1.0

> Este documento define el sistema de marcas (Brands) de la plataforma.
> Su propósito es administrar fabricantes o marcas comerciales,
> relacionarlas con productos y ofrecer páginas optimizadas para
> navegación y SEO.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un sistema de marcas reutilizable, escalable y desacoplado
del catálogo, permitiendo que una marca agrupe múltiples productos y
disponga de su propia página pública.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   CRUD de marcas.
-   Asociación con productos.
-   Página pública de marca.
-   Logo e imagen destacada.
-   Descripción.
-   Estado y visibilidad.
-   SEO básico.
-   APIs administrativas y públicas.

No incluye campañas de marketing específicas.

------------------------------------------------------------------------

# 3. Modelo de Dominio

## Brand

Campos mínimos:

-   id
-   slug
-   name
-   description
-   shortDescription
-   logoMediaId
-   coverMediaId
-   website
-   country
-   status
-   sortOrder
-   createdAt
-   updatedAt

------------------------------------------------------------------------

# 4. Reglas de Negocio

-   Nombre único.
-   Slug único.
-   Una marca puede tener muchos productos.
-   Un producto pertenece a una marca como máximo.
-   No eliminar una marca con productos asociados sin una acción
    explícita.

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   entidad Brand;
-   casos de uso;
-   repositorios;
-   validaciones;
-   controladores;
-   APIs administrativas y públicas.

------------------------------------------------------------------------

# 6. Frontend Administrativo

Interfaces para:

-   listado;
-   creación;
-   edición;
-   archivado;
-   búsqueda;
-   filtros;
-   asignación masiva de productos.

------------------------------------------------------------------------

# 7. Storefront

Crear páginas de marca con:

-   información general;
-   logo e imagen;
-   listado de productos;
-   filtros;
-   ordenamiento;
-   breadcrumbs.

------------------------------------------------------------------------

# 8. APIs

Endpoints mínimos:

-   GET /brands
-   GET /brands/:slug
-   POST /brands
-   PATCH /brands/:id
-   DELETE /brands/:id

------------------------------------------------------------------------

# 9. Rendimiento

Preparar:

-   caché de marcas;
-   paginación;
-   consultas indexadas;
-   carga diferida de productos.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   creación;
-   edición;
-   cambios de estado;
-   asociación y desasociación de productos.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio Brand;
-   esquema Prisma;
-   migraciones;
-   CRUD completo;
-   APIs;
-   páginas públicas;
-   interfaces administrativas;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   puedan administrarse marcas;
-   los productos puedan asociarse correctamente;
-   las páginas públicas funcionen;
-   las búsquedas y filtros por marca sean consistentes.

------------------------------------------------------------------------

# 13. Definition of Done

El sistema deberá integrarse sin cambios estructurales con:

-   005 Product Catalog
-   010 Media Library
-   012 Product SEO
-   014 Product Listing
-   015 Product Detail
