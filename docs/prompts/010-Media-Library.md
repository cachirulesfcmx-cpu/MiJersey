# 010 -- Media Library

## Engineering Specification

Version: 1.0

> Este documento define la biblioteca centralizada de archivos
> multimedia de la plataforma. Su propósito es administrar imágenes,
> videos y documentos reutilizables desde un único lugar, optimizando
> almacenamiento, rendimiento y consistencia.

------------------------------------------------------------------------

# 1. Objetivo

Implementar una Media Library escalable que permita cargar, organizar,
transformar y reutilizar activos digitales en productos, CMS, blog,
banners y cualquier otro módulo.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Imágenes.
-   Videos.
-   Documentos.
-   Organización por carpetas.
-   Etiquetas.
-   Metadatos.
-   Reutilización de archivos.
-   Procesamiento automático.
-   APIs administrativas.

No incluye CDN ni DAM externos, aunque deberá permitir integrarlos
posteriormente.

------------------------------------------------------------------------

# 3. Modelo de Dominio

## MediaAsset

Campos mínimos:

-   id
-   filename
-   originalName
-   mimeType
-   size
-   width
-   height
-   duration
-   altText
-   title
-   status
-   createdAt
-   updatedAt

## Folder

-   id
-   parentId
-   name
-   slug
-   createdAt

## AssetTag

-   id
-   name
-   slug

------------------------------------------------------------------------

# 4. Tipos Soportados

-   JPG
-   PNG
-   WebP
-   AVIF
-   SVG
-   MP4
-   PDF

El diseño deberá permitir incorporar nuevos formatos.

------------------------------------------------------------------------

# 5. Reglas de Negocio

-   Un archivo podrá reutilizarse en múltiples módulos.
-   No duplicar archivos idénticos.
-   Mantener historial de uso.
-   Eliminar físicamente solo cuando no existan referencias.

------------------------------------------------------------------------

# 6. Procesamiento

Implementar:

-   validación de archivos;
-   generación de miniaturas;
-   optimización automática;
-   conversión a formatos modernos cuando corresponda;
-   extracción de metadatos.

------------------------------------------------------------------------

# 7. Backend

Implementar:

-   dominio Media;
-   almacenamiento desacoplado;
-   repositorios;
-   casos de uso;
-   validaciones;
-   procesamiento asíncrono preparado para colas futuras.

------------------------------------------------------------------------

# 8. Frontend Administrativo

Interfaces para:

-   explorador de archivos;
-   carga mediante drag & drop;
-   búsqueda;
-   filtros;
-   selección múltiple;
-   vista en cuadrícula y lista;
-   editor de metadatos.

------------------------------------------------------------------------

# 9. APIs

Endpoints mínimos:

-   GET /media
-   POST /media/upload
-   PATCH /media/:id
-   DELETE /media/:id
-   GET /folders
-   POST /folders

------------------------------------------------------------------------

# 10. Rendimiento

Preparar:

-   carga diferida;
-   paginación;
-   miniaturas;
-   compresión;
-   caché de metadatos.

------------------------------------------------------------------------

# 11. Auditoría

Registrar:

-   cargas;
-   reemplazos;
-   cambios de metadatos;
-   eliminaciones;
-   referencias de uso.

------------------------------------------------------------------------

# 12. Entregables

Claude Code deberá generar:

-   dominio Media;
-   esquema Prisma;
-   migraciones;
-   gestor de archivos;
-   biblioteca administrativa;
-   APIs;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 13. Criterios de Aceptación

El módulo estará completo cuando:

-   los archivos puedan cargarse y reutilizarse;
-   existan miniaturas y metadatos;
-   la búsqueda y organización funcionen correctamente;
-   el sistema evite duplicados.

------------------------------------------------------------------------

# 14. Definition of Done

La Media Library deberá integrarse sin cambios estructurales con:

-   005 Product Catalog
-   012 Product SEO
-   013 Storefront Home
-   015 Product Detail
-   026 CMS Pages
-   027 Blog
