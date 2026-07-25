# 013 -- Storefront Home

## Engineering Specification

Version: 1.0

> Este documento define la página de inicio de la tienda. Su propósito
> es ofrecer una experiencia rápida, flexible y administrable desde el
> CMS.

## 1. Objetivo

Implementar una Home configurable mediante bloques reutilizables,
optimizada para conversión, SEO, rendimiento y dispositivos móviles.

## 2. Alcance

Incluye: - Hero banners - Carruseles - Productos destacados - Categorías
destacadas - Colecciones - Marcas - Promociones - Bloques CMS -
Newsletter - APIs públicas

## 3. Arquitectura

La portada estará compuesta por bloques independientes, reutilizables,
configurables, reordenables y activables/desactivables.

## 4. Bloques soportados

-   Hero Banner
-   Banner Grid
-   Featured Products
-   Featured Categories
-   Featured Collections
-   Featured Brands
-   Promotion Banner
-   Rich Text
-   Image + Text
-   Video Banner
-   Newsletter

## 5. Modelo de Dominio

### HomeSection

Campos mínimos: - id - type - title - configuration - sortOrder -
status - visibility - createdAt - updatedAt

## 6. Backend

Implementar: - dominio Home - casos de uso - repositorios - APIs
públicas y administrativas

## 7. Frontend Administrativo

Permitir: - agregar bloques - editar - reordenar (drag & drop) -
activar/desactivar - vista previa

## 8. Storefront

Aplicar: - SSR - lazy loading - imágenes optimizadas - componentes
reutilizables - estados vacíos

## 9. APIs

-   GET /home
-   PATCH /home
-   POST /home/sections
-   PATCH /home/sections/:id
-   DELETE /home/sections/:id

## 10. Rendimiento

-   caché
-   streaming cuando aplique
-   lazy loading
-   optimización de imágenes

## 11. SEO

Generar metadatos, Open Graph, datos estructurados y contenido
indexable.

## 12. Auditoría

Registrar cambios de contenido, orden, activación y publicación.

## 13. Entregables

-   dominio Home
-   editor visual
-   bloques reutilizables
-   APIs
-   integración CMS
-   documentación
-   pruebas

## 14. Criterios de Aceptación

La Home podrá administrarse completamente sin modificar código.

## 15. Definition of Done

Preparada para integrarse con: - 014 Product Listing - 015 Product
Detail - 026 CMS Pages - 027 Blog - 028 Navigation Builder
