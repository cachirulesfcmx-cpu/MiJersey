# 008 -- Attributes & Filters

## Engineering Specification

Version: 1.0

> Este documento define el sistema de atributos y filtros del catálogo.
> Su propósito es permitir clasificar productos mediante características
> reutilizables y ofrecer búsquedas facetadas rápidas y escalables.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un sistema flexible de atributos que permita crear filtros
dinámicos para mejorar la administración del catálogo y la experiencia
de compra.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Definición de atributos globales.
-   Valores reutilizables.
-   Asignación a productos y variantes.
-   Filtros facetados.
-   Especificaciones técnicas.
-   APIs públicas y administrativas.

No incluye SEO (Documento 012).

------------------------------------------------------------------------

# 3. Modelo de Dominio

## Attribute

Campos mínimos:

-   id
-   code
-   name
-   type
-   isFilterable
-   isComparable
-   isRequired
-   sortOrder
-   status

## AttributeValue

-   id
-   attributeId
-   value
-   label
-   sortOrder

## ProductAttribute

-   productId
-   attributeId
-   valueId (opcional)
-   customValue (opcional)

------------------------------------------------------------------------

# 4. Tipos de Atributo

Soportar como mínimo:

-   Texto
-   Número
-   Booleano
-   Fecha
-   Lista
-   Color
-   Medida

El diseño deberá permitir incorporar nuevos tipos.

------------------------------------------------------------------------

# 5. Reglas de Negocio

-   Código único por atributo.
-   Valores reutilizables cuando aplique.
-   Un atributo puede ser obligatorio.
-   Un atributo puede participar en filtros, comparaciones o ambos.
-   Los cambios no deben romper productos existentes.

------------------------------------------------------------------------

# 6. Backend

Implementar:

-   entidades Attribute, AttributeValue y ProductAttribute;
-   casos de uso;
-   repositorios;
-   validaciones;
-   indexación para filtros;
-   APIs administrativas y públicas.

------------------------------------------------------------------------

# 7. Frontend Administrativo

Interfaces para:

-   CRUD de atributos;
-   gestión de valores;
-   asignación a productos;
-   reordenamiento;
-   búsqueda;
-   acciones masivas.

------------------------------------------------------------------------

# 8. Storefront

Permitir:

-   filtros múltiples;
-   conteo por faceta;
-   eliminación individual de filtros;
-   filtros persistentes en URL;
-   ordenamiento combinado con filtros.

------------------------------------------------------------------------

# 9. APIs

Endpoints mínimos:

-   GET /attributes

-   POST /attributes

-   PATCH /attributes/:id

-   DELETE /attributes/:id

-   GET /filters

-   GET /products/search

------------------------------------------------------------------------

# 10. Rendimiento

Preparar:

-   consultas indexadas;
-   caché de filtros;
-   cálculo eficiente de facetas;
-   paginación;
-   respuesta consistente para catálogos grandes.

------------------------------------------------------------------------

# 11. Auditoría

Registrar:

-   creación;
-   edición;
-   cambios de tipo;
-   eliminación lógica;
-   asignaciones masivas.

------------------------------------------------------------------------

# 12. Entregables

Claude Code deberá generar:

-   dominio Attribute;
-   dominio AttributeValue;
-   esquema Prisma;
-   migraciones;
-   CRUD completo;
-   motor de filtros;
-   interfaces administrativas;
-   integración con Storefront;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 13. Criterios de Aceptación

El módulo estará completo cuando:

-   puedan administrarse atributos reutilizables;
-   los productos soporten múltiples atributos;
-   los filtros funcionen correctamente en la tienda;
-   las búsquedas sean consistentes y rápidas.

------------------------------------------------------------------------

# 14. Definition of Done

El sistema deberá quedar preparado para integrarse con:

-   009 Inventory
-   012 Product SEO
-   014 Product Listing
-   015 Product Detail
-   016 Search

sin requerir cambios estructurales.
