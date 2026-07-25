# 015 -- Product Detail (PDP)

## Engineering Specification

Version: 1.0

> Este documento define la página de detalle del producto (Product
> Detail Page). Su objetivo es ofrecer toda la información necesaria
> para facilitar la compra, maximizando conversión, rendimiento y SEO.

------------------------------------------------------------------------

# 1. Objetivo

Implementar una PDP modular, rápida y completamente integrada con
variantes, inventario, contenido multimedia y carrito de compra.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Galería multimedia.
-   Información del producto.
-   Variantes.
-   Precio y promociones.
-   Disponibilidad.
-   Especificaciones.
-   Productos relacionados.
-   Compartir en redes.
-   SEO.
-   APIs públicas.

No incluye reseñas de clientes (preparado para futura ampliación).

------------------------------------------------------------------------

# 3. Componentes

La página deberá incluir:

-   Galería de imágenes y video.
-   Nombre del producto.
-   Marca.
-   SKU.
-   Precio.
-   Precio anterior (cuando aplique).
-   Selector de variantes.
-   Estado de inventario.
-   Cantidad.
-   Botón Agregar al carrito.
-   Botón Comprar ahora.
-   Descripción.
-   Especificaciones.
-   Productos relacionados.
-   Breadcrumbs.

------------------------------------------------------------------------

# 4. Variantes

Permitir:

-   cambio instantáneo;
-   actualización de precio;
-   actualización de imágenes;
-   actualización de disponibilidad;
-   actualización de SKU.

------------------------------------------------------------------------

# 5. Backend

Implementar:

-   servicio de consulta del producto;
-   resolución de variantes;
-   integración con inventario;
-   integración con SEO;
-   APIs públicas.

------------------------------------------------------------------------

# 6. Frontend

Crear componentes reutilizables para:

-   Media Gallery
-   Variant Selector
-   Price Box
-   Quantity Selector
-   Product Specifications
-   Related Products
-   Sticky Add To Cart

------------------------------------------------------------------------

# 7. APIs

Endpoints mínimos:

-   GET /products/:slug
-   GET /products/:slug/related
-   GET /variants/:id

------------------------------------------------------------------------

# 8. Rendimiento

Aplicar:

-   SSR;
-   imágenes optimizadas;
-   lazy loading;
-   precarga de recursos críticos;
-   caché cuando corresponda.

------------------------------------------------------------------------

# 9. SEO

Generar automáticamente:

-   title;
-   meta description;
-   canonical;
-   Open Graph;
-   JSON-LD Product;
-   breadcrumbs estructurados.

------------------------------------------------------------------------

# 10. Auditoría

Registrar eventos administrativos relacionados con:

-   cambios de contenido;
-   cambios de variantes;
-   cambios de precio.

------------------------------------------------------------------------

# 11. Entregables

Claude Code deberá generar:

-   componentes PDP;
-   APIs;
-   integración con catálogo, inventario y SEO;
-   documentación;
-   pruebas relevantes.

------------------------------------------------------------------------

# 12. Criterios de Aceptación

El módulo estará completo cuando:

-   todas las variantes funcionen correctamente;
-   el inventario se actualice en tiempo real;
-   la experiencia sea responsive y accesible;
-   la página cumpla los requisitos SEO.

------------------------------------------------------------------------

# 13. Definition of Done

La PDP deberá integrarse sin cambios estructurales con:

-   016 Search
-   017 Shopping Cart
-   018 Checkout
-   021 Orders
-   024 Coupons & Promotions
