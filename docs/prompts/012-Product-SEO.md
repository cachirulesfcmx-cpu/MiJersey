# 012 -- Product SEO

## Engineering Specification

Version: 1.0

> Este documento define la estrategia SEO del catálogo y las páginas de
> producto. Su objetivo es garantizar una arquitectura preparada para
> buscadores, redes sociales y crecimiento orgánico sin depender de
> implementaciones posteriores.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un sistema SEO centralizado, reutilizable y extensible para
productos, categorías, colecciones y marcas, permitiendo optimizar el
posicionamiento orgánico y la compartición en plataformas externas.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Metadatos SEO.
-   URLs amigables.
-   Canonical URLs.
-   Open Graph.
-   Twitter Cards.
-   Schema.org.
-   Robots.
-   XML Sitemaps.
-   Redirecciones.
-   Control de indexación.

No incluye estrategia de contenido (Documento 027 -- Blog).

------------------------------------------------------------------------

# 3. Modelo de Dominio

## SeoMetadata

Campos mínimos:

-   id
-   entityType
-   entityId
-   metaTitle
-   metaDescription
-   metaKeywords
-   canonicalUrl
-   robots
-   ogTitle
-   ogDescription
-   ogImageMediaId
-   twitterCard
-   structuredData
-   createdAt
-   updatedAt

------------------------------------------------------------------------

# 4. Reglas de Negocio

-   Cada entidad tendrá como máximo un registro SEO.
-   El título SEO tendrá longitud recomendada.
-   La descripción SEO tendrá longitud recomendada.
-   Canonical único por página.
-   URLs únicas.
-   Redirecciones permanentes cuando cambie un slug.

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   dominio SEO;
-   repositorios;
-   casos de uso;
-   validaciones;
-   generador de metadatos;
-   generador de sitemaps;
-   gestor de redirecciones.

------------------------------------------------------------------------

# 6. Frontend Administrativo

Interfaces para:

-   editar metadatos;
-   vista previa SERP;
-   configuración de robots;
-   vista previa Open Graph;
-   gestión de redirecciones.

------------------------------------------------------------------------

# 7. Storefront

Generar automáticamente:

-   title;
-   meta description;
-   canonical;
-   Open Graph;
-   Twitter Cards;
-   JSON-LD;
-   breadcrumbs estructurados.

------------------------------------------------------------------------

# 8. APIs

Endpoints mínimos:

-   GET /seo/:entityType/:entityId
-   PATCH /seo/:entityType/:entityId
-   GET /sitemap.xml
-   GET /robots.txt

------------------------------------------------------------------------

# 9. Rendimiento

Preparar:

-   generación eficiente de sitemaps;
-   caché de metadatos;
-   invalidación automática tras cambios;
-   renderizado compatible con SSR.

------------------------------------------------------------------------

# 10. Auditoría

Registrar:

-   cambios de metadatos;
-   cambios de slugs;
-   creación de redirecciones;
-   cambios de indexación.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   dominio SEO;
-   esquema Prisma;
-   migraciones;
-   gestor SEO;
-   generador de sitemap;
-   gestor de robots;
-   sistema de redirecciones;
-   interfaces administrativas;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   todas las entidades soporten metadatos;
-   las páginas generen etiquetas SEO correctamente;
-   existan sitemaps y robots válidos;
-   las redirecciones funcionen sin pérdida de posicionamiento.

------------------------------------------------------------------------

# 13. Definition of Done

El sistema SEO deberá integrarse sin cambios estructurales con:

-   005 Product Catalog
-   006 Categories & Collections
-   011 Brands
-   013 Storefront Home
-   014 Product Listing
-   015 Product Detail
-   027 Blog
