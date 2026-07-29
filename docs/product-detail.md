# Product Detail Page (PDP)

Implementación de [`docs/prompts/015-Product-Detail.md`](prompts/015-Product-Detail.md). No crea un módulo nuevo: extiende Catalog con una capa de enriquecimiento (`GetPublicProductUseCase`) que compone datos de Brands, Taxonomy, Attributes, Inventory, Media y SEO en una sola respuesta pública, siguiendo el mismo patrón "enrich public view" usado por Brand (011), Category/Collection (014) y Home (013). Excluye reseñas de clientes, como marca la spec.

## Galería de producto: modelo nuevo

`Product` no tenía ningún campo de imagen antes de este sprint (solo `ProductVariant.imageId`, un id de `MediaAsset` opcional por variante). Se agregó `ProductMedia`, tabla de unión ordenada `Product`↔`MediaAsset`:

```prisma
model ProductMedia {
  productId String
  mediaId   String
  sortOrder Int      @default(0)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@id([productId, mediaId])
  @@index([productId])
  @@map("product_media")
}
```

`mediaId` no tiene relación de Prisma hacia `MediaAsset` a propósito — mismo criterio que `Brand.logoMediaId` (011): se consulta y registra uso vía `MediaUsageService`, no una FK directa. `SetProductGalleryUseCase` reemplaza el arreglo completo en cada guardado (`replaceAll`, no altas/bajas incrementales) y diffea contra el estado anterior para llamar `recordUsage`/`removeUsage` solo sobre los ids que realmente cambiaron — mismo patrón que `HomeMediaUsageService` (013).

## `ProductEntity` sigue "pura"

Igual que `brandId`/categorías no viven en `ProductEntity` (documentado en `docs/brands.md`), la PDP no le agrega ni marca ni categorías ni galería al núcleo del producto. Toda esa información se resuelve en una capa de enriquecimiento aparte:

- **`ProductDetailLookupPort`** (nuevo, propio de Catalog): lee directamente `products.brandId` y `product_categories` — las mismas tablas físicas que Brands y Taxonomy poseen — sin importar `BrandsModule`/`TaxonomyModule`. Mismo espíritu CQRS que `HomeLookupPort`/`SitemapSourcePort` de sprints anteriores.
- **`InventoryAvailabilityPort`** (nuevo, propio de Catalog): `InventoryModule` no exporta nada, así que Catalog lee `inventory_items` directamente vía Prisma (`groupBy` por `variantId`, `_sum: availableQuantity`) para calcular disponibilidad agregada entre almacenes. `availableQuantity` ya es neto de reservas (confirmado leyendo `isBelowSafetyStock` y el flujo de reservas de 009), así que un `SUM` simple es correcto — no hace falta restar `reservedQuantity` de nuevo.

## `GetPublicProductUseCase`: la enriquecida

Sustituye al `GetPublicProductUseCase` anterior (un simple passthrough). Ahora, para `GET /products/:slug`:

1. Valida `status: ACTIVE` + `visibility: PUBLIC` (mismo criterio 404 que el resto del catálogo público).
2. En paralelo: relaciones (marca/categorías), galería, opciones, variantes (`findManyPublic` con `pageSize = MAX_PDP_VARIANTS = 100` — reutilización pragmática del método paginado existente en vez de agregar un puerto sin paginar, bajo el supuesto de que ningún producto real tiene más de 100 variantes vivas), especificaciones (reutiliza `ListProductAttributesUseCase` de Attributes, exportado además de `SearchProductsUseCase` para este fin) y metadatos SEO.
3. Resuelve disponibilidad por variante (`InventoryAvailabilityPort`) y agrega todos los `mediaId` necesarios (galería + imagen de cada variante + logo de marca) en un único lote deduplicado a `MediaUsageService.resolveUrls`.
4. Arma `PublicProductView`: producto base + `brand` (con `logoUrl` ya resuelto) + `categories` + `galleryUrls` + `options` (con sus valores) + `variants` (con `price`, `compareAtPrice`, `imageUrl`, `availableQuantity`, `inStock`) + `specifications` + `seo` (vía `buildPublicSeoView`, con la primera imagen de galería o de variante como OG image de respaldo).

## Productos relacionados: categoría primero, marca como respaldo

`GetRelatedProductsUseCase` reutiliza el motor de listados de 014 (`SearchProductsUseCase`/`ProductListingScope`) en vez de construir lógica propia — se le agregó un único campo nuevo, `excludeProductId`, para que el producto no aparezca en su propia lista de relacionados:

```ts
/** Prioriza la primera categoría del producto; si no tiene ninguna, cae a su marca. Sin ninguna de las dos, no hay base de relevancia y se devuelve una lista vacía en vez de "populares" inventados. */
```

Decisión de alcance explícita: sin categoría ni marca, no se inventa un fallback de "productos populares" — se devuelve `[]`. Ampliar esto a una heurística de popularidad o similitud por atributos queda fuera de esta spec.

## `GET /variants/:id`: refresco puntual de una variante

Nuevo endpoint público (`PublicVariantsController`), pensado para cuando el storefront necesite releer una sola variante (p. ej. tras una reserva de otro cliente). Valida que la variante esté `ACTIVE` **y** que el producto padre esté `ACTIVE`+`PUBLIC` — cualquiera de las dos condiciones que falle lanza el mismo `ProductVariantNotFoundError` (404 unificado, no hay necesidad de distinguir el motivo desde el cliente).

## Endpoints

| Método | Ruta                          | Permiso          | Descripción                                                                                                |
| ------ | ----------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------- |
| GET    | `/products/:slug`             | público          | PDP enriquecida (marca, categorías, galería, opciones+variantes con disponibilidad, especificaciones, SEO) |
| GET    | `/products/:slug/related`     | público          | Hasta `limit` (máx. 20, por defecto 8) productos relacionados                                              |
| GET    | `/variants/:id`               | público          | Detalle público de una variante puntual                                                                    |
| GET    | `/admin/products/:id/gallery` | `admin:access`   | Galería ordenada con URLs ya resueltas                                                                     |
| PATCH  | `/admin/products/:id/gallery` | `catalog:manage` | Reemplaza la galería completa (`mediaIds: string[]`, máx. 20)                                              |

## SDK

- `packages/sdk/src/catalog.types.ts`: `PublicProduct` (`Product & {brand, categories, galleryUrls, options, variants, specifications, seo}`), `PublicProductBrandSummary`, `PublicProductCategorySummary`, `PublicProductOption(Value)`, `PublicProductVariant`, `ProductGalleryItem`, `SetProductGalleryInput`.
- `api-client.ts`: `getPublicProduct(slug)` corregido para devolver `PublicProduct` (antes tipado incorrectamente como `Product` plano); nuevos `getRelatedProducts(slug, limit?)`, `getPublicVariant(id)`, `getProductGallery(accessToken, productId)`, `setProductGallery(accessToken, productId, input)`.

## Frontend admin: galería en el editor de producto

`GalleryEditor.tsx` (nuevo, `apps/admin/src/app/(dashboard)/products/`), insertado en la página de edición de producto justo después del formulario general. Sigue el patrón de arreglo ordenado ya usado por `HomeSectionConfigForm` (`BANNER_GRID`, 013) pero lo extiende con controles explícitos de reordenamiento (**Subir**/**Bajar** por fila) en vez de solo alta/baja — la galería de un producto sí necesita orden explícito (primera imagen = imagen principal de la PDP), mientras que el patrón de 013 no lo requería. `MediaPicker` en modo "agregar" (`value` siempre `null`) actúa como botón para sumar imágenes nuevas; "Guardar galería" persiste el arreglo completo vía `setProductGallery`.

## Frontend storefront: `/products/[slug]`

Mismo patrón Server Component + Client Component que `/brands/[slug]` (011) y `/categories/[slug]` (014):

- **`page.tsx`**: `generateMetadata` desde `product.seo`; JSON-LD `Product` (con `offers` por variante, `availability` derivado de `inStock`) y `BreadcrumbList` (Inicio → primera categoría del producto, si tiene → nombre del producto) embebidos como `<script type="application/ld+json">`; delega el resto a `ProductDetailClient`.
- **`ProductDetailClient.tsx`** (`'use client'`): galería con miniaturas, selector de variante por opción (los botones de cada opción recalculan la variante activa buscando cuál `variant.optionValueIds` contiene todos los `valueId` seleccionados — sin combinación válida, se muestra "Combinación no disponible" en vez de un precio inventado), caja de precio (con `compareAtPrice` tachado si existe), selector de cantidad (acotado a `availableQuantity` de la variante activa), especificaciones, descripción, y productos relacionados (reutiliza `ProductGrid`/`ProductCard` de 014, cargados vía `getRelatedProducts` en un efecto aparte ya que es un endpoint distinto al de detalle).
- **Agregar al carrito / Comprar ahora son botones deshabilitados** con `title="Disponible cuando se implemente el carrito (017)"` — Cart (017) todavía no existe en este código base; conectarlos queda para ese sprint.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): producto de prueba con marca, categoría, opción "Talla" (S/M/L), tres variantes generadas, una imagen subida a Media Library y asignada como galería, e inventario cargado solo para la variante M (15 unidades) en un almacén de prueba. Verificado por API: `GET /products/:slug` devuelve marca, categoría, `galleryUrls`, opciones/variantes con `availableQuantity`/`inStock` correctos por variante (M en stock, S/L agotadas), y `seo` autogenerado; `GET /variants/:id` replica la misma vista para una sola variante; `GET /products/:slug/related` devuelve `[]` con un solo producto en la categoría y devuelve el segundo producto de prueba al agregarlo a la misma categoría, excluyéndose a sí mismo; `PATCH /admin/products/:id/gallery` y su `GET` correspondiente funcionan de punta a punta. En `apps/admin`: el editor de producto muestra la sección **Galería** con la imagen subida, controles de Subir/Bajar/Quitar y Guardar galería. En `apps/web`: `/products/pdp-test-jersey` renderiza breadcrumbs, imagen de galería, marca, precio, selector de talla (clic en "M" actualiza precio/disponibilidad/estado del botón de cantidad al instante), botones de carrito deshabilitados, especificaciones/descripción, y la sección de productos relacionados con el segundo producto de prueba. Todos los datos y el usuario de prueba se eliminaron de Railway al finalizar.

## Alcance diferido

- **Sin reseñas de clientes** (explícito en la spec — sprint futuro).
- **Sin lightbox ni zoom de imagen** en la galería del storefront: la spec pide una galería funcional, no interacciones avanzadas de imagen; se documenta como posible mejora, no como requisito incumplido.
- **Botones de carrito son stubs visuales**: Cart (017) no existe todavía en este código base; el diseño de la PDP ya contempla dónde conectarlos.
- **`ListableProduct`/`ProductCard` (014) siguen sin imagen ni precio**: los "productos relacionados" de la PDP usan `ProductSummary` (el mismo shape que categorías/marcas/búsqueda), que tampoco expone esos campos — agregarlos requeriría una agregación `MIN(price)`/imagen principal a nivel de listado, fuera del alcance de esta spec puntual sobre el detalle de un producto.
- **Sin variante seleccionada por query string** (p. ej. `?variant=id` para compartir un enlace directo a una talla): no está en la spec; el selector siempre arranca en la primera variante disponible.
