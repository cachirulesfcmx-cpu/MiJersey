# 027 -- Blog

## Engineering Specification

Version: 1.0

> Este documento define el módulo de Blog. Su propósito es gestionar
> contenido editorial optimizado para SEO, autoridad de marca y
> captación de tráfico orgánico.

------------------------------------------------------------------------

# 1. Objetivo

Implementar un sistema de publicaciones desacoplado con editor
enriquecido, categorías, etiquetas, autores, programación y contenido
relacionado.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Artículos.
-   Categorías.
-   Etiquetas.
-   Autores.
-   Editor enriquecido.
-   Borradores.
-   Publicación programada.
-   SEO.
-   Contenido relacionado.
-   APIs autenticadas.

No incluye comentarios públicos.

------------------------------------------------------------------------

# 3. Modelo de Dominio

## Post

Campos mínimos:

-   id
-   title
-   slug
-   excerpt
-   content
-   featuredImage
-   authorId
-   status
-   publishedAt
-   seoTitle
-   seoDescription
-   createdAt
-   updatedAt

## Category

-   id
-   name
-   slug

## Tag

-   id
-   name
-   slug

------------------------------------------------------------------------

# 4. Reglas de Negocio

-   Cada slug será único.
-   Admitir múltiples categorías y etiquetas.
-   Mantener borradores y versiones.
-   Permitir programación de publicaciones.
-   Generar contenido relacionado por categorías y etiquetas.

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   dominio Blog;
-   casos de uso;
-   repositorios;
-   versionado;
-   renderizado;
-   APIs autenticadas.

------------------------------------------------------------------------

# 6. Frontend

Crear componentes para:

-   Blog Home;
-   Article Detail;
-   Rich Text Editor;
-   Category Archive;
-   Tag Archive;
-   Related Posts;
-   Author Profile.

------------------------------------------------------------------------

# 7. APIs

Endpoints mínimos:

-   GET /blog/posts
-   GET /blog/posts/:slug
-   POST /blog/posts
-   PATCH /blog/posts/:id
-   DELETE /blog/posts/:id
-   GET /blog/categories
-   GET /blog/tags

------------------------------------------------------------------------

# 8. Rendimiento

Aplicar:

-   SSR/SSG cuando corresponda;
-   caché de publicaciones;
-   imágenes optimizadas;
-   paginación;
-   carga diferida de contenido no crítico.

------------------------------------------------------------------------

# 9. SEO

Generar automáticamente:

-   title;
-   meta description;
-   canonical;
-   Open Graph;
-   Twitter Cards;
-   JSON-LD Article;
-   sitemap;
-   RSS.

------------------------------------------------------------------------

# 10. Seguridad

Implementar:

-   autorización por roles;
-   validación del contenido;
-   auditoría de cambios.

------------------------------------------------------------------------

# 11. Auditoría

Registrar:

-   creación;
-   edición;
-   publicaciones;
-   restauración de versiones;
-   eliminación.

------------------------------------------------------------------------

# 12. Entregables

Claude Code deberá generar:

-   dominio Blog;
-   esquema Prisma;
-   migraciones;
-   editor enriquecido;
-   APIs;
-   componentes frontend;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 13. Criterios de Aceptación

El módulo estará completo cuando:

-   los artículos puedan administrarse de extremo a extremo;
-   el SEO sea configurable;
-   exista programación y versionado;
-   el contenido relacionado funcione correctamente.

------------------------------------------------------------------------

# 14. Definition of Done

El módulo deberá integrarse sin cambios estructurales con:

-   026 CMS Pages
-   028 Navigation Builder
-   032 Analytics
-   033 Tracking & Pixels
