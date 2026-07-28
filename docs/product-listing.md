# Product Listing (PLP)

Implementación de [`docs/prompts/014-Product-Listing.md`](prompts/014-Product-Listing.md). No crea un módulo nuevo: extiende el motor de búsqueda facetada que ya existía en Attributes (008) con un **alcance** (`categoryId`/`brandId`/`search`) y lo reutiliza como fuente única de datos para las páginas de listado de categorías, marcas y búsqueda del storefront.

## Una sola decisión de alcance, documentada desde el principio

En vez de reimplementar filtros facetados por separado en Taxonomy y Brands, `ProductQueryPort.searchProducts`/`computeFacets` (Attributes, 008) ganó un `ProductListingScope` opcional:

```ts
export interface ProductListingScope {
  categoryId?: string;
  brandId?: string;
  search?: string; // contains, insensible a mayúsculas, sobre name/sku
}
```

`PrismaProductQueryRepository.buildScopeWhere(scope)` traduce esto a condiciones Prisma adicionales (`categories: { some: { categoryId } }`, `brandId`, `OR` de `name`/`sku`) que se combinan con `PUBLIC_PRODUCT_WHERE` y los filtros de atributos existentes, tanto en `searchProducts` como en `computeFacets` — así las facetas que ve el usuario ya reflejan el alcance actual (p. ej. los conteos de "Color" en la categoría "Playeras" solo cuentan productos de esa categoría).

**Colecciones quedan fuera de este motor a propósito**: `GetPublicCollectionUseCase` (006) sigue resolviendo SMART (por reglas `NAME/SKU/TYPE/STATUS`) y MANUAL (lista ordenada a mano) exactamente como antes — no pasa por `ProductQueryPort` de Attributes. Meter colecciones en el motor de facetas habría exigido o bien ampliar `CollectionRuleField` con `CATEGORY`/`BRAND`/atributos (cambio de esquema no pedido por esta spec) o bien evaluar reglas SMART en JS después de una consulta ya paginada (rompe la paginación a nivel SQL). El costo de esa unificación no se justificaba frente al beneficio, así que las páginas de colección no tienen filtros facetados ni ordenamiento — ver "Alcance diferido".

## `/products/search` como motor único reutilizado por tres fuentes

- **`GET /products/search`** (Catalog, ya existía) ahora acepta `categoryId`/`brandId`/`search` además de `filters`/`sortBy`/`sortDir` — es el punto de entrada genérico.
- **`GET /categories/:slug/products`** (nuevo, Taxonomy): resuelve la categoría por slug y delega en el mismo `SearchProductsUseCase` con `categoryId` como alcance. `TaxonomyModule` importa `AttributesModule` únicamente para esto (mismo patrón que `CatalogModule` desde 008).
- **`GET /brands/:slug/products`** (ya existía, reescrito): antes usaba el `ProductQueryPort` propio de Brands (`findByBrand`, sin facetas ni filtros); ahora delega en el mismo `SearchProductsUseCase` con `brandId` como alcance, ganando filtros facetados y búsqueda de texto gratis. La forma de respuesta (`ProductSummary`) es idéntica a la que ya devolvía `findByBrand`, así que el cambio es compatible con quien ya consumía el endpoint. `BrandsModule` importa `AttributesModule` por el mismo motivo que Taxonomy.
- **`GET /filters`** (Attributes, ya existía): acepta los mismos `categoryId`/`brandId`/`search` para pedir facetas ya escaladas al contexto — es la fuente de datos de `FilterSidebar` para cualquiera de las tres páginas.

`GetFiltersUseCase` solo cachea en Redis el conjunto de facetas **global** (sin filtros ni alcance) — el mismo criterio que ya existía para "sin filtros", extendido: cualquier alcance de categoría/marca/búsqueda se calcula en caliente, sin cachear, para no explotar la caché con una entrada por cada combinación posible.

## Categorías: endpoint público nuevo, con breadcrumbs y SEO automático

`GetPublicCategoryUseCase` (nuevo) sigue el mismo patrón ya establecido con Brands (011) y Collections (ahora también, ver abajo): `toPublicCategoryView()` adjunta un campo `seo: PublicSeoView` resuelto vía `GetSeoMetadataUseCase` (`SeoEntityType.CATEGORY`, ya existía en el enum desde 012 aunque nadie lo usaba todavía) con fallback automático a nombre/descripción de la categoría. `category.image` ya es una URL directa (no un id de `MediaAsset`, a diferencia de `Brand.logoMediaId`), así que no hace falta `MediaUsageService` aquí.

Los `breadcrumbs` se calculan reutilizando `GetCategoryPathUseCase` (ya existía para el admin, sin cambios) y devolviendo `{id, slug, name}` por cada ancestro, raíz primero.

## Colecciones: mismo patrón de SEO, añadido en este sprint

`GetPublicCollectionUseCase` no tenía `seo` en su respuesta pública. Se le agregó exactamente el mismo patrón (`buildPublicSeoView` + `GetSeoMetadataUseCase` con `SeoEntityType.COLLECTION`) para que `/collections/:slug` también sirva metadatos automáticos — cerrando el hueco que 012 había dejado explícitamente para "cuando el endpoint público exista".

## Endpoints

| Método | Ruta                         | Alcance soportado                 | Descripción                                                      |
| ------ | ---------------------------- | --------------------------------- | ---------------------------------------------------------------- |
| GET    | `/products/search`           | `categoryId`, `brandId`, `search` | Motor genérico: filtros facetados + alcance + orden + paginación |
| GET    | `/filters`                   | `categoryId`, `brandId`, `search` | Facetas disponibles, ya escaladas al alcance                     |
| GET    | `/categories/:slug`          | —                                 | Detalle público (breadcrumbs + SEO)                              |
| GET    | `/categories/:slug/products` | `categoryId` (implícito)          | Delega en `/products/search`                                     |
| GET    | `/brands/:slug/products`     | `brandId` (implícito)             | Delega en `/products/search` (antes usaba un motor propio)       |
| GET    | `/collections/:slug`         | —                                 | Sin cambios de comportamiento; ahora incluye `seo`               |

## SDK

- `packages/sdk/src/attribute.types.ts`: `ProductListingScope`, `SearchProductsParams extends ProductListingScope`.
- `packages/sdk/src/taxonomy.types.ts`: `PublicCategory` (`Category & {breadcrumbs, seo}`), `PublicCategoryBreadcrumb`; `CollectionWithProducts` ahora incluye `seo`.
- `api-client.ts`: `getPublicCategory(slug)`, `listCategoryProducts(slug, params)`; `getFilters`/`searchProducts` aceptan el alcance; `listPublicBrandProducts` acepta `filters`/`search` además de `sortBy`/`sortDir`.

## Frontend (`apps/web/src/components/plp/`)

Componentes reutilizables (spec §6), todos genéricos — ninguno sabe si está en una categoría, una marca o una búsqueda:

- **`ProductListingClient`**: el componente central. Recibe un `scope: {categoryId?, brandId?}` y hace todo el trabajo — llama a `searchProducts`/`getFilters` con ese alcance, sincroniza `page`/`sortBy`/`sortDir`/`search`/`view`/`filters` con la URL (`useProductListingUrlState`, spec §3 "URL compartible con filtros persistentes"), y renderiza `FilterSidebar` + `ActiveFilters` + `SortSelector` + `ViewToggle` + `ProductGrid` + `Pagination` (de `@mijersey/ui`). Usado por `/categories/[slug]` y `/brands/[slug]` (antes esta última tenía su propia grilla ad-hoc sin filtros ni URL persistente — se generalizó al mismo componente) y por `/search`.
- **`CollectionListingClient`**: variante más simple para `/collections/[slug]` — reutiliza `ProductGrid`/`Pagination`/`ViewToggle`, pero no `FilterSidebar`/`SortSelector`/`ActiveFilters` (las colecciones no pasan por el motor de facetas, ver arriba).
- **`ProductCard`/`ProductGrid`**: trabajan sobre una forma mínima (`ListableProduct = {id, slug, name, sku}`) satisfecha tanto por `ProductSearchSummary` (búsqueda/categoría/marca) como por `CollectionProductSummary` (colecciones) — mismo componente sirve a ambas fuentes de datos sin conversión. Sin imagen ni precio: ninguna de las dos fuentes los expone todavía (llegan con 015-Product-Detail, cuando exista un modelo de precio a nivel de producto).
- **`FilterSidebar`**: checkboxes por faceta (`valueId` para tipos `LIST`/`COLOR`, `value` como texto libre para el resto), togglea `AttributeFilterInput[]`.
- **`ActiveFilters`**: chips removibles por cada valor de filtro activo y por el término de búsqueda, más "Limpiar todo".
- **`SortSelector`** / **`ViewToggle`**: controles simples, sin dependencias externas.
- **`Breadcrumbs`**: lista de `{label, href?}` reutilizada por categorías, colecciones y búsqueda; también alimenta el `BreadcrumbList` de JSON-LD en `/categories/[slug]` (spec §9 "breadcrumbs estructurados").

## Páginas (Server Component + Client Component, mismo patrón que Brands/Home)

- **`/categories/[slug]`**: `generateMetadata` desde `category.seo`, JSON-LD `BreadcrumbList` (o `structuredData` manual si el admin configuró uno), `<ProductListingClient scope={{categoryId}} />`.
- **`/brands/[slug]`**: sin cambios en su cabecera (banner/logo/descripción/sitio web); la sección de productos ahora es `<ProductListingClient scope={{brandId}} />`.
- **`/collections/[slug]`**: `generateMetadata` desde `collection.seo`, `<CollectionListingClient slug={slug} />`.
- **`/search`**: sin entidad que resolver — `<ProductListingClient scope={{}} showSearchBox />`; el cuadro de búsqueda vive dentro del propio componente porque no hay otro lugar en el sitio (todavía) para cambiar el término. `robots: {index: false}` (una página de resultados de búsqueda no debería indexarse con cada combinación de query posible).

## Verificación en vivo

Contra Railway (Postgres + Redis reales): categoría, marca, atributo filtrable `Color` (LIST, valores Rojo/Azul) y dos productos publicados (uno rojo, uno azul, ambos en la categoría y la marca de prueba), más una colección manual con los mismos dos productos. Verificado por API: `/products/search?categoryId=X` y `?brandId=X` devuelven ambos productos; `?search=Roja` devuelve solo uno; combinar `categoryId` + `filters` de atributo filtra correctamente; `/filters?categoryId=X` devuelve las facetas ya escaladas (conteos 1/1); `/categories/:slug` devuelve breadcrumbs y SEO automático; `/categories/:slug/products` y `/brands/:slug/products` delegan correctamente en el motor común; `/collections/:slug` ahora incluye `seo`. En `apps/web`: `/categories/playeras` renderizado con filtro de Color, clic en "Rojo" actualiza la URL (`?filters=...`) y filtra a un solo resultado con su chip en `ActiveFilters`; recargar la página con esa URL reproduce exactamente el mismo estado (filtro aplicado, faceta marcada) — confirmando la persistencia de estado en la URL; `/brands/plp-test-brand` renderiza el mismo motor con facetas donde antes no las tenía; `/search?q=Roja` filtra correctamente y muestra el chip de búsqueda; `/collections/playeras-destacadas` renderiza ambos productos sin filtros. Todos los datos y el usuario de prueba se eliminaron de Railway al finalizar.

## Alcance diferido

- **Sin ordenamiento ni facetas en colecciones** (ver arriba) — decisión de diseño documentada, no un olvido.
- **Sin imagen ni precio en las tarjetas de producto**: ninguna fuente actual los expone a nivel de listado (el precio vive en `ProductVariant`, sin agregación `MIN(price)` todavía); construir esa agregación (o desnormalizar un `fromPrice` en `Product`) queda para cuando 015-Product-Detail defina el modelo de precio público.
- **Sin "productos relacionados" ni "promociones" como fuente de listado**: no existe un concepto de dominio para ninguno de los dos todavía (una "promoción" no es una entidad, y "relacionados" necesitaría una regla de similitud que ningún sprint ha definido) — no se inventó uno para no exceder lo pedido por la spec.
- **Sin virtualización de listas largas**: con paginación de 20 productos por página no hace falta; se revisará si el catálogo crece mucho antes de que exista paginación infinita.
- **`/search` no tiene un cuadro de búsqueda global en el header del sitio** (no existe todavía un header de navegación compartido — eso es más bien terreno de 028-Navigation-Builder, mencionado en la Definition of Done de 013-Storefront-Home).
