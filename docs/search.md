# Search

Implementación de [`docs/prompts/016-Search.md`](prompts/016-Search.md). Módulo nuevo (`apps/api/src/modules/search`) que no reemplaza el motor de listados de 014 (`/products/search`, filtros facetados por categoría/marca) sino que lo complementa con una búsqueda **global** (productos + categorías + marcas + colecciones), autocompletado, tolerancia a errores tipográficos, sinónimos, historial y analítica básica.

## Por qué un módulo nuevo y no una extensión de 014

`SearchProductsUseCase` (Attributes, 014) resuelve "listar productos de una categoría/marca con texto libre y facetas" — sigue siendo la fuente de la grilla de productos en `/search`. Pero 016 pide mostrar **también** categorías/marcas/colecciones como resultado, autocompletado, historial de búsquedas y analítica — conceptos sin dueño natural en Attributes/Catalog. Se creó `SearchModule` con su propio puerto de lectura (`SearchLookupPort`), mismo patrón CQRS de solo-lectura usado en toda la sesión (015 `ProductDetailLookupPort`, 013 `HomeLookupPort`): lee directamente las tablas de `products`/`categories`/`brands`/`collections` sin importar esos módulos.

## Tolerancia a errores tipográficos: `pg_trgm` con `word_similarity`, no `similarity`

La migración `add_search` agrega `CREATE EXTENSION IF NOT EXISTS pg_trgm` y un índice GIN trigram (`gin_trgm_ops`) sobre `name` en `products`/`categories`/`brands`/`collections` — no modelable en `schema.prisma` (sin soporte nativo para extensiones/índices GIN), así que se agregó a mano editando el `migration.sql` generado con `prisma migrate dev --create-only`.

La búsqueda difusa usa `word_similarity(termino, name)`, no `similarity(name, termino)`. Verificado contra datos reales: para el nombre "Jersey Titan Rojo" y el typo "Jerzey", `similarity()` da `0.19` (por debajo de cualquier umbral razonable, ya que compara la cadena completa) mientras que `word_similarity()` da `0.43` (compara el término contra la mejor sub-cadena de palabras dentro del nombre) — imprescindible para nombres de producto de varias palabras. `MIN_TRIGRAM_SIMILARITY = 0.3` quedó calibrado contra este caso real, no un valor arbitrario.

El flujo es: intento exacto (`ILIKE` contains sobre nombre/SKU/descripción, con expansión de sinónimos) → si devuelve cero resultados, reintento con `word_similarity` sobre el término original (sin expandir, ya que el typo no coincidirá con ningún sinónimo tampoco).

## Ranking: pesos nombrados, no una tabla editable

`PrismaSearchLookupRepository.searchProducts` trae hasta 200 candidatos por `ILIKE` (evita cargar catálogos enormes) y los puntúa en memoria: coincidencia exacta de SKU (100) > nombre exacto (90) > nombre empieza con (70) > nombre contiene (50) > SKU contiene (40) > descripción contiene (20). Es la superficie de "ranking configurable" que pide la spec — configurable en el sentido de que son constantes nombradas fáciles de ajustar, no un editor de pesos en el admin. Un editor de ranking a nivel admin queda fuera de alcance (nadie lo pidió operar en producción todavía).

## Sinónimos

`SearchSynonym` es un grupo simple: `term` único + `synonyms: string[]` (columna nativa de Postgres, sin tabla de unión). `findExpansions(term)` busca el grupo donde `term` coincide con el `term` del grupo o aparece en su arreglo `synonyms` (filtro `{ has: term }` de Prisma, sin SQL crudo) y devuelve la unión de todos los miembros. Sin grupo, devuelve `[term]` — la búsqueda sigue funcionando igual, solo sin expansión.

CRUD admin en `/admin/search/synonyms`, reutilizando los permisos `admin:access`/`catalog:manage` ya existentes — no se creó un permiso `search:manage` dedicado por un puñado de rutas de bajo tráfico.

## Historial y analítica: básicos, el resto llega con 032-Analytics

`SearchQueryLog` registra cada `/search` (término, término normalizado, cantidad de resultados, `sessionId` opcional). `SearchClickLog` registra clics sobre resultados vía `POST /search/click`. De ahí:

- **`/search/trending`** (público): términos más buscados en los últimos `TRENDING_WINDOW_DAYS = 7` días, cacheados en Redis 5 minutos (`SearchCacheService`, mismo patrón cache-aside que `SeoCacheService`/sitemap) — no necesita ser en tiempo real.
- **`/admin/search/analytics`** (admin): términos más buscados (7 días) + términos con cero resultados (30 días). Es el "básico" explícito del spec — un panel con clics agregados por producto y conversión posterior a compra queda para 032-Analytics, que además depende de Orders (021), inexistente en este código base.

**No existe un concepto de sesión de invitado a nivel de backend** (confirmado: ni Cart ni Wishlist existen todavía). `sessionId` es generado por el storefront (`crypto.randomUUID()`, persistido en `localStorage`) y viaja como parámetro opcional — decisión documentada, no un descuido.

## Autocompletado: solo nombres de producto

`GetSearchSuggestionsUseCase` se apoya en `suggestProductNames` (prefijo `ILIKE`, con el mismo fallback `word_similarity` si el prefijo no matchea nada). Categorías/marcas/colecciones no se duplican en el dropdown de autocompletado porque ya aparecen agrupadas en los resultados de `/search` — es una única decisión de "dónde vive cada cosa", no una omisión.

## Endpoints

| Método | Ruta                         | Permiso          | Descripción                                                                         |
| ------ | ---------------------------- | ---------------- | ----------------------------------------------------------------------------------- |
| GET    | `/search`                    | público          | Búsqueda global: productos (paginados) + categorías/marcas/colecciones (tope 5 c/u) |
| GET    | `/search/suggestions`        | público          | Autocompletado sobre nombres de producto                                            |
| GET    | `/search/trending`           | público          | Términos más buscados (cacheado en Redis)                                           |
| POST   | `/search/click`              | público          | Registra un clic sobre un resultado                                                 |
| GET    | `/admin/search/synonyms`     | `admin:access`   | Lista de grupos de sinónimos                                                        |
| POST   | `/admin/search/synonyms`     | `catalog:manage` | Crea un grupo                                                                       |
| PATCH  | `/admin/search/synonyms/:id` | `catalog:manage` | Edita un grupo                                                                      |
| DELETE | `/admin/search/synonyms/:id` | `catalog:manage` | Elimina un grupo                                                                    |
| GET    | `/admin/search/analytics`    | `admin:access`   | Términos más buscados + búsquedas sin resultados                                    |

## SDK

- `packages/sdk/src/search.types.ts`: `SearchResult`, `SearchResultItem`, `SearchParams`, `TrendingTerm`, `SearchSynonym`, `SearchAnalytics`, `LogSearchClickInput`.
- `api-client.ts`: `search(params)`, `getSearchSuggestions(params)`, `getTrendingSearches(limit?)`, `logSearchClick(input)`, `listSearchSynonyms`/`createSearchSynonym`/`updateSearchSynonym`/`deleteSearchSynonym`, `getSearchAnalytics`.

## Frontend admin

Página nueva `/search` (`apps/admin`): tabla de sinónimos (patrón idéntico a `/redirects` — alta inline + `DataTable` + `ConfirmDialog` de borrado) y dos listas de solo lectura para la analítica básica.

## Frontend storefront: SearchBox + Autocomplete + Recent Searches en un componente

La spec pide componentes separados para Search Box/Autocomplete/Recent Searches; se implementaron como un único componente (`apps/web/src/components/search/SearchBox.tsx`) porque comparten el mismo dropdown y el mismo estado de foco — separarlos en tres archivos habría significado pasar el mismo estado (`isOpen`, `suggestions`, `recent`) de un lado a otro sin beneficio real. `SearchBox` reemplaza el `<input>` plano que `ProductListingClient` (014) ya tenía tras `showSearchBox` — única modificación a ese componente, sin tocar su lógica de filtros/paginación.

`RelatedMatches.tsx` (nuevo) resuelve las coincidencias de categorías/marcas/colecciones para el término activo en `/search`, llamando al nuevo `GET /search` — un segundo llamado de red además del que `ProductListingClient` ya hace contra `/products/search`, aceptado como costo de mantener ambos motores desacoplados (documentado, no un descuido de rendimiento).

`Search Results`/`Search Filters`/`Empty Results` ya existían como parte de `ProductListingClient` (014) — 016 no los duplica.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): dos productos de prueba ("Jersey Titan Rojo", "Balon Titan Pro"). Verificado por API: `GET /search?q=Titan` devuelve ambos, rankeados; `?q=Jerzey` y `?q=Titn` (typos) devuelven cero resultados con `similarity()` pero encuentran los productos correctos tras cambiar a `word_similarity()`; crear el grupo de sinónimos `jersey=camiseta,playera` hace que `?q=camiseta` encuentre "Jersey Titan Rojo"; `/search/suggestions?q=Tit` autocompleta ambos productos; `POST /search/click` registra 204; `/search/trending` y `/admin/search/analytics` reflejan los términos y conteos reales acumulados durante la verificación. En `apps/web`: `/search?q=titan` renderiza los dos productos vía `ProductListingClient`; escribir en el `SearchBox` dispara el dropdown de autocompletado tras el debounce; hacer clic en una sugerencia dispara `POST /search/click` y ejecuta la búsqueda. En `apps/admin`: `/search` muestra el grupo de sinónimos creado y ambos paneles de analítica con datos reales. Todos los datos y el usuario de prueba se eliminaron de Railway al finalizar.

## Alcance diferido

- **Sin editor de pesos de ranking en el admin** — los pesos son constantes nombradas en código, ver arriba.
- **Sin panel de clics/conversiones ni funnel de compra** — llega con 032-Analytics, que además depende de Orders (021).
- **Sin sesión de invitado a nivel de backend** — `sessionId` es responsabilidad del storefront (localStorage) hasta que 017-Shopping-Cart (que sí necesita este concepto) lo formalice.
- **Autocompletado no incluye categorías/marcas/colecciones** — ya aparecen agrupadas en los resultados de `/search`, evitando duplicar la misma información en dos lugares de la misma página.
- **Sin páginas de búsqueda indexables** (spec §10): `/search` sigue con `robots: {index: false}` (decisión ya tomada en 014) — una página de resultados de búsqueda no debería indexarse con cada combinación de query posible.
