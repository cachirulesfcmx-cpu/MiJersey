# Storefront Home

Implementación de [`docs/prompts/013-Storefront-Home.md`](prompts/013-Storefront-Home.md). Vive en su propio módulo (`apps/api/src/modules/home`): una Home configurable a partir de bloques (`HomeSection`) reordenables, activables/desactivables y editables sin tocar código.

## Modelo de dominio

- **HomeSection**: `type` (uno de los 11 bloques soportados), `title` (etiqueta administrativa, no se muestra en el storefront salvo que el bloque la use explícitamente), `configuration` (JSON libre cuya forma depende de `type`), `sortOrder`, `status` (`DRAFT`|`PUBLISHED`), `isVisible` (booleano).
- **`status` vs `isVisible`**: son dos interruptores independientes a propósito — `status` es el ciclo de vida editorial (borrador → publicada) y `isVisible` es el interruptor rápido de "ocultar temporalmente sin perder el trabajo" que pide la spec §5 ("visibility") sin obligar a volver a borrador. El storefront solo muestra secciones `PUBLISHED` **y** `isVisible=true`.
- **Bloques soportados** (`HomeSectionType`): `HERO_BANNER`, `BANNER_GRID`, `FEATURED_PRODUCTS`, `FEATURED_CATEGORIES`, `FEATURED_COLLECTIONS`, `FEATURED_BRANDS`, `PROMOTION_BANNER`, `RICH_TEXT`, `IMAGE_TEXT`, `VIDEO_BANNER`, `NEWSLETTER` — spec §4.
- **`configuration` por tipo** (`domain/value-objects/home-section-config.ts`): cada tipo tiene una interfaz TS documentando su forma esperada (p. ej. `HeroBannerConfig { imageMediaId, headline, ... }`, `FeaturedProductsConfig { heading?, productIds }`). `validateHomeSectionConfig(type, configuration)` valida la forma mínima antes de guardar (campos obligatorios presentes y del tipo correcto) — no es un esquema JSON completo, es la validación suficiente para no persistir un bloque roto, mismo criterio que el textarea de `structuredData` en SEO (012).

## Los bloques `FEATURED_*` solo guardan IDs; la Home los resuelve en la lectura pública

`FEATURED_PRODUCTS/CATEGORIES/COLLECTIONS/BRANDS` guardan listas explícitas de IDs elegidos a mano por el admin (mismo criterio que las colecciones `MANUAL` de 006) — no hay motor de reglas automático aquí, eso es responsabilidad de 014-Product-Listing para las páginas de listado, no de la Home. `HomeLookupPort` (`domain/ports/home-lookup.port.ts`) es una lectura propia de Home sobre `products`/`categories`/`collections`/`brands` vía Prisma directo, implementada en `PrismaHomeLookupRepository` — mismo patrón que `SitemapSourcePort`/`EntityLookupPort` de SEO (012) y `ProductQueryPort` de Brands (011): `HomeModule` no importa `CatalogModule`/`TaxonomyModule`/`BrandsModule`, solo lee sus tablas.

## Enriquecimiento (`HomeEnrichmentService`)

`GetPublicHomeUseCase` obtiene las secciones `PUBLISHED`+visibles y las pasa por `HomeEnrichmentService.enrich()`, que:

1. Recolecta todos los `mediaId` embebidos en `configuration` (`extractMediaIds`) y todos los IDs de producto/categoría/colección/marca referenciados (`extractEntityRefs`) a través de **todas** las secciones de una sola pasada.
2. Resuelve los lookups de entidades en bloque (`HomeLookupPort.findProductsByIds/findCategoriesByIds/...`, una consulta por tipo de entidad, no por sección).
3. Añade a la resolución de medios los `imageMediaId`/`logoMediaId` que vinieron de esos resultados (portada de producto, logo de marca) y resuelve todas las URLs de una vez vía `MediaUsageService.resolveUrls`.
4. Reconstruye el `configuration` público de cada sección con URLs y resúmenes ya listos (p. ej. `HeroBannerConfig{imageMediaId}` → `{imageUrl}`; `FeaturedProductsConfig{productIds}` → `{items:[{id,slug,name,imageUrl,fromPrice}]}`) — el storefront nunca recibe un ID crudo que tenga que resolver por su cuenta.

`fromPrice` de un producto destacado es el precio mínimo entre sus variantes `ACTIVE` (no existe un campo de precio a nivel de producto — vive en `ProductVariant.price`, ver 007).

## Uso de medios (`HomeMediaUsageService`)

Igual que Brands (011): al crear/editar/borrar una sección se registra o libera el uso de cada `MediaAsset` embebido en su `configuration` vía `MediaUsageService` (exportada por `MediaModule`, importado por `HomeModule`) — `DELETE /admin/media/:id` se bloquea (409) mientras una sección de Home siga usando ese archivo. En una edición, se calcula el diff entre los `mediaId` de la configuración anterior y la nueva para registrar solo los que se añadieron y liberar solo los que se quitaron.

## Endpoints

| Método | Ruta                           | Permiso          | Descripción                                                    |
| ------ | ------------------------------ | ---------------- | -------------------------------------------------------------- |
| GET    | `/admin/home/sections`         | `admin:access`   | Todas las secciones (incluye borrador/oculta), por `sortOrder` |
| POST   | `/admin/home/sections`         | `catalog:manage` | Alta (se agrega al final, `sortOrder` = máximo + 1)            |
| PATCH  | `/admin/home/sections/reorder` | `catalog:manage` | Reordena por lote (spec §7 "drag & drop")                      |
| PATCH  | `/admin/home/sections/:id`     | `catalog:manage` | Edición (título/configuración/estado/visibilidad)              |
| DELETE | `/admin/home/sections/:id`     | `catalog:manage` | Libera el uso de medios y borra                                |
| GET    | `/home`                        | público          | Secciones publicadas+visibles, enriquecidas y ordenadas        |

`PATCH /admin/home/sections/reorder` se declara antes que `PATCH /admin/home/sections/:id` para que Express no confunda `reorder` con un id (mismo caso que en 005–012). Los nombres de ruta se alejan deliberadamente de la lista literal del spec (`GET/PATCH /home`, `POST/PATCH/DELETE /home/sections`) para seguir la convención ya establecida en todo el proyecto: `/admin/*` para gestión con permisos, ruta raíz para lectura pública — la spec describe la funcionalidad, no un contrato de URL exacto.

## Errores mapeados (`HomeExceptionFilter`)

| Error                           | HTTP | Motivo                                               |
| ------------------------------- | ---- | ---------------------------------------------------- |
| `HomeSectionNotFoundError`      | 404  | —                                                    |
| `InvalidHomeSectionConfigError` | 400  | `configuration` no cumple la forma mínima del `type` |

## Auditoría y permisos

Namespace `home.*`: `home.section.created`, `home.section.updated`, `home.section.deleted`, `home.section.reordered`. Reutiliza `admin:access` (lecturas) y `catalog:manage` (escrituras) — mismo criterio que el resto de módulos administrativos.

## Frontend administrativo

- **`apps/admin` — `/home`**: lista todas las secciones con su tipo, estado (badge Publicada/Borrador, click para alternar), visibilidad (badge Visible/Oculta, click para alternar), flechas ▲/▼ para reordenar (mismo patrón de "arriba/abajo" ya usado en el editor de productos de una colección, 006 — no hay drag-and-drop real; el input `order: string[]` que espera `PATCH /admin/home/sections/reorder` es idéntico al que ya usan `reorderCollectionProducts`/`reorderCategories`/`reorderBrands`, así que añadir una interacción de arrastre en el futuro solo toca el frontend), botón "+ Agregar sección" y edición inline por sección.
- **`HomeSectionConfigForm`** (`src/components/`, reutilizable): un formulario específico por `type` — campos de texto simples para títulos/URLs, `MediaPicker` (010) para cualquier campo `*MediaId`, y el nuevo `EntityMultiPicker` para los bloques `FEATURED_*` (buscador con resultados en vivo + chips removibles; para `FEATURED_CATEGORIES` no hay endpoint de búsqueda paginada — se usa `getCategoryTree` una vez y se filtra en cliente, ya que el árbol de categorías es pequeño por diseño).
- **`EntityMultiPicker`** (`src/components/`, reutilizable): selector genérico de múltiples IDs por búsqueda; recibe una función `searchOptions(query)` inyectada por el llamador, así que el mismo componente sirve para productos, categorías, colecciones y marcas sin duplicar código.

## Storefront

- **`apps/web` — `/` (Server Component)**: reemplaza la portada de bienvenida de 001. Llama a `GET /home` en el servidor (`ApiClient.getPublicHome()`), y por cada sección renderiza el bloque correspondiente vía `HomeSectionRenderer` (`src/components/home/`). `export const revalidate = 60` (ISR) — sin esto, Next.js prerenderizaría `/` una sola vez en build y un cambio del admin en la Home no se vería sin un redeploy.
- **`HomeSectionRenderer`**: un `switch` por `type`; cada rama vuelve a leer el `configuration` ya enriquecido (URLs y resúmenes resueltos) sin llamadas adicionales. Si el contenido resuelto de una sección queda vacío (p. ej. todos los productos de un `FEATURED_PRODUCTS` fueron despublicados después de configurarse), el bloque completo no se renderiza — el "estado vacío" a nivel de Home es simplemente omitir la sección, no mostrar un placeholder roto (spec §8).
- **Imágenes**: `<img>` con `loading="lazy"` (excepto el primer bloque, marcado `priority` para no penalizar el LCP) — se mantiene el mismo patrón que el resto del storefront/admin (`eslint-disable @next/next/no-img-element`) en vez de introducir `next/image` de forma aislada solo aquí; adoptarlo en todo el proyecto (con los `remotePatterns` del host de medios) queda fuera de este sprint.
- **`RICH_TEXT`**: se renderiza con `dangerouslySetInnerHTML` — el HTML lo escribe un administrador autenticado en el editor, no un usuario final, mismo nivel de confianza que el JSON-LD manual de SEO (012).
- **`NEWSLETTER`**: `NewsletterForm` es un Client Component puramente presentacional (guarda el email en estado local y muestra un mensaje de agradecimiento) — 013 no define un puerto de persistencia de suscriptores en el dominio; conectarlo a un proveedor real de email/CRM queda para un sprint dedicado.

## SDK

`packages/sdk/src/home.types.ts` + métodos en `ApiClient`: `listHomeSections`, `createHomeSection`, `updateHomeSection`, `deleteHomeSection`, `reorderHomeSections`, `getPublicHome`.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): creación de una marca y una imagen de prueba → alta de `HERO_BANNER` con `configuration` incompleta rechazada (400 `INVALID_HOME_SECTION_CONFIG`) → alta válida de `HERO_BANNER`, `FEATURED_BRANDS`, `RICH_TEXT` (sin publicar) y `NEWSLETTER` → `GET /home` confirmado que excluye la sección en borrador y devuelve las demás enriquecidas (imagen del hero resuelta a URL real, marca resuelta a `{id,slug,name,imageUrl}`) → reordenamiento por lote verificado (`PATCH .../reorder`) reflejado en el orden de `GET /home` → alternar `isVisible` verificado ocultando/mostrando una sección publicada sin cambiar su `status` → intento de borrar el archivo de medios en uso bloqueado (409 `MEDIA_ASSET_IN_USE`), liberado automáticamente al borrar la sección que lo usaba, borrado exitoso después. En `apps/web`: la portada (`/`) inspeccionada visualmente y por texto, mostrando los tres bloques publicados con sus datos reales (headline y CTA del hero, tarjeta de marca destacada, formulario de newsletter). En `apps/admin`: `/home` mostrando las cuatro secciones con sus badges de estado/visibilidad correctos, y el panel de edición de `FEATURED_BRANDS` mostrando el chip de la marca seleccionada vía `EntityMultiPicker`. Todos los datos y el usuario de prueba se eliminaron de Railway al finalizar.

## Alcance diferido

Sin drag-and-drop real (se usan flechas arriba/abajo, ver más arriba). Sin constructor visual de HTML para `RICH_TEXT` (textarea de HTML crudo). Sin integración con el sistema de `SeoMetadata` (012) para la Home como "entidad" — la portada usa metadatos estáticos (`export const metadata` en `apps/web/src/app/page.tsx`); generalizar `SeoMetadata`/`PublicSeoView` a páginas arbitrarias es explícitamente terreno de 026-CMS-Pages según la Definition of Done de la spec. Sin captura real de suscriptores de newsletter (ver arriba). La resolución de `FEATURED_CATEGORIES` en el admin usa el árbol completo de categorías sin paginación — aceptable mientras el árbol sea pequeño; si crece mucho convendría un endpoint de búsqueda dedicado, igual que ya existe para productos/colecciones/marcas.
