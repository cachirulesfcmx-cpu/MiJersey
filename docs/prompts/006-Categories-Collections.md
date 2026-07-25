# 006 -- Categories & Collections

## Engineering Specification

Version: 1.0

> Este documento define la organización del catálogo mediante categorías
> y colecciones. Debe permitir una navegación flexible, escalable y
> optimizada para la administración y la experiencia de compra.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un sistema que permita clasificar productos mediante
categorías jerárquicas y colecciones dinámicas o manuales, sin duplicar
información.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Categorías ilimitadas.
-   Jerarquía multinivel.
-   Colecciones manuales.
-   Colecciones automáticas por reglas.
-   Asociación múltiple de productos.
-   URLs amigables.
-   Orden personalizado.
-   APIs públicas y administrativas.

No incluye atributos ni filtros avanzados (Documento 008).

------------------------------------------------------------------------

# 3. Modelo de Dominio

## Category

Campos mínimos:

-   id
-   parentId
-   slug
-   name
-   description
-   image
-   sortOrder
-   status
-   createdAt
-   updatedAt

## Collection

Campos mínimos:

-   id
-   slug
-   name
-   description
-   type (Manual \| Smart)
-   status
-   createdAt
-   updatedAt

------------------------------------------------------------------------

# 4. Reglas de Negocio

Categorías:

-   Slug único.
-   Nombre obligatorio.
-   No permitir ciclos en la jerarquía.
-   Soportar profundidad configurable.

Colecciones:

-   Manuales mediante selección de productos.
-   Inteligentes mediante reglas.
-   Actualización automática cuando cambien los productos.

------------------------------------------------------------------------

# 5. Jerarquía

Permitir:

-   árbol expandible;
-   mover nodos;
-   reordenar mediante drag & drop;
-   visualizar rutas completas (breadcrumbs).

------------------------------------------------------------------------

# 6. Backend

Implementar:

-   entidades Category y Collection;
-   casos de uso;
-   repositorios;
-   validaciones;
-   reglas para colecciones inteligentes;
-   APIs administrativas y públicas.

------------------------------------------------------------------------

# 7. Frontend Administrativo

Interfaces para:

-   listado;
-   árbol de categorías;
-   editor;
-   creador de colecciones;
-   constructor de reglas;
-   acciones masivas;
-   búsqueda.

------------------------------------------------------------------------

# 8. APIs

Endpoints mínimos:

-   GET /categories

-   POST /categories

-   PATCH /categories/:id

-   DELETE /categories/:id

-   GET /collections

-   POST /collections

-   PATCH /collections/:id

-   DELETE /collections/:id

------------------------------------------------------------------------

# 9. Rendimiento

Preparar:

-   carga diferida del árbol;
-   consultas optimizadas;
-   caché para navegación pública;
-   paginación donde aplique.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   creación;
-   edición;
-   reordenamiento;
-   cambios de reglas;
-   archivado.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio Category;
-   dominio Collection;
-   esquema Prisma;
-   migraciones;
-   CRUD completo;
-   editor jerárquico;
-   constructor de reglas;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   sea posible administrar categorías jerárquicas;
-   las colecciones manuales e inteligentes funcionen correctamente;
-   los productos puedan pertenecer a múltiples categorías y
    colecciones;
-   la navegación pública consuma correctamente la estructura.

------------------------------------------------------------------------

# 13. Definition of Done

El módulo deberá quedar preparado para integrarse con:

-   007 Product Variants
-   008 Attributes & Filters
-   013 Storefront Home
-   014 Product Listing

sin requerir cambios estructurales.
