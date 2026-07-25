# 007 -- Product Variants

## Engineering Specification

Version: 1.0

> Este documento define el sistema de variantes de productos. Su
> propósito es permitir que un mismo producto tenga múltiples
> combinaciones (talla, color, versión, etc.) sin duplicar información.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un modelo flexible de variantes que soporte múltiples
opciones, SKUs independientes, precios, inventario e imágenes por
combinación.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Opciones de variante.
-   Valores de opción.
-   Generación de combinaciones.
-   SKU por variante.
-   Precio por variante.
-   Imagen por variante.
-   Estado y visibilidad.
-   APIs administrativas y públicas.

No incluye inventario detallado (Documento 009).

------------------------------------------------------------------------

# 3. Modelo de Dominio

## ProductOption

Campos mínimos:

-   id
-   productId
-   name
-   position

## ProductOptionValue

-   id
-   optionId
-   value
-   position

## ProductVariant

Campos mínimos:

-   id
-   productId
-   sku
-   barcode
-   slug
-   title
-   price
-   compareAtPrice
-   weight
-   imageId
-   status
-   createdAt
-   updatedAt

------------------------------------------------------------------------

# 4. Reglas de Negocio

-   SKU único por variante.
-   Cada combinación debe ser única.
-   Un producto puede no tener variantes.
-   El producto base no duplica datos de las variantes.
-   Cambios en opciones deben regenerar combinaciones cuando
    corresponda.

------------------------------------------------------------------------

# 5. Generación de Variantes

Permitir:

-   creación manual;
-   generación automática de todas las combinaciones;
-   edición individual;
-   eliminación segura de combinaciones.

------------------------------------------------------------------------

# 6. Backend

Implementar:

-   entidades ProductVariant, ProductOption y ProductOptionValue;
-   casos de uso;
-   validaciones;
-   repositorios;
-   servicios de generación de combinaciones;
-   APIs administrativas y públicas.

------------------------------------------------------------------------

# 7. Frontend Administrativo

Interfaces para:

-   administrar opciones;
-   crear valores;
-   generar variantes;
-   edición masiva;
-   filtros;
-   acciones masivas.

------------------------------------------------------------------------

# 8. APIs

Endpoints mínimos:

-   GET /products/:id/variants

-   POST /products/:id/variants

-   PATCH /variants/:id

-   DELETE /variants/:id

-   POST /products/:id/options

-   PATCH /options/:id

-   DELETE /options/:id

------------------------------------------------------------------------

# 9. Rendimiento

Preparar:

-   edición masiva eficiente;
-   paginación de variantes;
-   consultas optimizadas;
-   carga diferida cuando existan cientos de combinaciones.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   creación de variantes;
-   cambios de precio;
-   cambios de SKU;
-   eliminación;
-   generación automática.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio ProductVariant;
-   dominio ProductOption;
-   esquema Prisma;
-   migraciones;
-   CRUD;
-   generador de combinaciones;
-   interfaces administrativas;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   puedan administrarse múltiples opciones;
-   las combinaciones sean únicas;
-   cada variante tenga SKU independiente;
-   las APIs y el panel funcionen correctamente.

------------------------------------------------------------------------

# 13. Definition of Done

El sistema de variantes deberá integrarse sin cambios estructurales con:

-   008 Attributes & Filters
-   009 Inventory
-   014 Product Detail
-   017 Shopping Cart
-   021 Orders
