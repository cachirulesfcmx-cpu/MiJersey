# 005 -- Product Catalog

## Engineering Specification

Version: 1.0

> Este documento define el núcleo del catálogo de productos. Todos los
> módulos relacionados (variantes, inventario, SEO, categorías y
> promociones) dependerán de esta base.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un catálogo robusto, escalable y preparado para administrar
miles de productos con información estructurada, reutilizable y
optimizada para la tienda y el panel administrativo.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   CRUD de productos.
-   Productos activos, borrador y archivados.
-   Productos físicos y digitales (preparado para el futuro).
-   Slugs.
-   SKU.
-   Estado de publicación.
-   Organización del catálogo.
-   Validaciones.
-   APIs administrativas y públicas.

No incluye:

-   Variantes (Documento 007).
-   Inventario (Documento 009).
-   SEO avanzado (Documento 012).

------------------------------------------------------------------------

# 3. Modelo de Dominio

Entidad principal:

-   Product

Campos mínimos:

-   id
-   sku
-   slug
-   name
-   shortDescription
-   description
-   status
-   visibility
-   type
-   createdAt
-   updatedAt

El modelo deberá ser extensible sin romper compatibilidad.

------------------------------------------------------------------------

# 4. Estados

Estados mínimos:

-   Draft
-   Active
-   Archived

Visibilidad:

-   Public
-   Hidden

------------------------------------------------------------------------

# 5. Reglas de Negocio

-   SKU único.
-   Slug único.
-   Nombre obligatorio.
-   No permitir publicar productos inválidos.
-   Registrar auditoría de cambios importantes.
-   Permitir guardar borradores.

------------------------------------------------------------------------

# 6. Backend

Implementar:

-   Entidad Product.
-   Casos de uso.
-   Repositorios.
-   DTOs.
-   Validaciones.
-   Controladores.
-   Servicios de búsqueda.

------------------------------------------------------------------------

# 7. Frontend Administrativo

Crear interfaces para:

-   listado de productos;
-   creación;
-   edición;
-   duplicado;
-   archivado;
-   eliminación lógica;
-   filtros;
-   búsqueda;
-   acciones masivas.

------------------------------------------------------------------------

# 8. APIs

Endpoints mínimos:

-   GET /products
-   GET /products/:id
-   POST /products
-   PATCH /products/:id
-   DELETE /products/:id

Separar APIs administrativas y públicas.

------------------------------------------------------------------------

# 9. Rendimiento

Implementar:

-   paginación;
-   filtros;
-   ordenamiento;
-   búsqueda;
-   carga incremental.

Preparado para catálogos grandes.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   creación;
-   edición;
-   archivado;
-   publicación;
-   eliminación lógica.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio Product;
-   esquema Prisma;
-   migraciones;
-   CRUD completo;
-   APIs;
-   interfaces administrativas;
-   pruebas relevantes;
-   documentación.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   sea posible crear, editar, consultar, archivar y publicar productos;
-   todas las validaciones funcionen;
-   el listado soporte búsqueda, filtros y paginación.

------------------------------------------------------------------------

# 13. Definition of Done

El catálogo deberá servir como base para implementar sin modificaciones
estructurales los documentos:

-   006 Categories & Collections
-   007 Product Variants
-   008 Attributes & Filters
-   009 Inventory
-   012 Product SEO
