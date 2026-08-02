# Navigation Builder

Implementación de [`docs/prompts/028-Navigation-Builder.md`](prompts/028-Navigation-Builder.md). Módulo nuevo (`apps/api/src/modules/navigation`) que centraliza los menús del sitio: jerarquía configurable, mega menús, múltiples ubicaciones, enlaces internos/externos y dinámicos (categoría/colección/marca/producto/página), visibilidad por contexto, versionado y render cacheado.

## Árbol reemplazado completo en cada guardado: self-relation con `Cascade`, no `Restrict`

`NavigationItem.parentId` es un self-relation, igual que `Category`/`Folder` — pero a diferencia de esos dos (que usan `onDelete: Restrict` porque un nodo se borra de uno en uno), aquí se usa `onDelete: Cascade`. La razón: el Tree Editor guarda el árbol completo de un menú en cada `PATCH` (mismo patrón "reemplazo total" que `PageBlock` en CMS Pages, 026), así que `update()` hace `deleteMany({ menuId })` + recreación — borrar un subárbol entero de una vez es exactamente lo que este acceso necesita, y `Restrict` lo habría bloqueado.

## Jerarquía por `tempId`, no por id real

Como el árbol se envía completo en cada creación/actualización y los ítems nuevos no tienen id todavía, el DTO usa un `tempId` asignado por el cliente (string arbitrario, único en la solicitud) y `parentTempId` para expresar jerarquía. `PrismaNavigationMenuRepository` inserta los ítems en orden padre-primero (`toParentFirstOrder`, orden topológico de un árbol) y arma un mapa `tempId → id real` sobre la marcha para resolver cada `parentId`. Los snapshots de versión (`NavigationVersion.snapshot`) guardan los ítems en este mismo formato `tempId`/`parentTempId` — restaurar una versión reutiliza el id real ya persistido como `tempId`, sin necesitar una conversión especial.

## Profundidad configurable, validada en el dominio

`MAX_NAVIGATION_DEPTH = 3` (spec §4 "profundidad configurable de niveles"). `assertValidTreeDepth` recorre cada ítem hacia su raíz contando niveles y detecta tanto padres inexistentes en la solicitud como ciclos — se ejecuta sobre los `tempId` antes de escribir en `create`/`update`, para fallar con un error de dominio claro (`NAVIGATION_DEPTH_EXCEEDED`) en vez de una recursión infinita o una fila huérfana.

## Enlaces dinámicos: validados al guardar, resueltos al renderizar

`NavigationItemType` tiene `LINK` (URL propia, en `target`) y cinco tipos dinámicos (`CATEGORY`/`COLLECTION`/`BRAND`/`PRODUCT`/`PAGE`) cuyo `target` es el id de la entidad referenciada — sin FK de Prisma hacia esas tablas, mismo criterio que `Payment.orderId`/`Brand.logoMediaId`: Navigation no importa Catalog/Taxonomy/Brands/CMS. `NavigationLookupPort` (implementado consultando esas tablas directamente, igual que `SitemapSourcePort` de SEO 012) cumple dos roles:

- **Al guardar** (`assertItemsValid`): confirma que el recurso existe y está en un estado público (`ACTIVE`/`PUBLISHED`, mismos filtros que usa el sitemap) antes de aceptar el ítem — spec §4 "validar referencias a recursos internos".
- **Al renderizar** (`GetRenderedMenuUseCase`): resuelve la ruta pública real (`/categories/:slug`, `/products/:slug`, `/pages/:slug`, etc.) y, si el recurso ya no existe o dejó de ser público, **descarta el ítem (y su subárbol)** en vez de romper la respuesta — spec §4 "mantener consistencia al eliminar recursos enlazados", verificado en vivo ocultando una categoría enlazada y confirmando que desaparece del árbol renderizado sin afectar a sus hermanos.

## Mega menús: por profundidad de la jerarquía, no un campo nuevo

La spec no incluye un campo `isMegaMenu` en los "campos mínimos" de `NavigationItem`. En vez de agregar uno, un ítem de nivel superior se trata como mega menú cuando sus hijos tienen hijos propios (dos niveles de anidamiento) — el storefront (`SiteNavigation`) lo detecta así y renderiza columnas; con un solo nivel de hijos, renderiza un dropdown simple. Misma jerarquía, misma tabla, sin campo adicional.

## Múltiples menús activos por ubicación: resuelto de forma determinista

`location` es un string libre (no un enum cerrado) para no limitar de antemano el conjunto de ubicaciones del sitio (spec §2 "múltiples ubicaciones"), mismo criterio que `Page.template`. La spec permite varios menús `PUBLISHED` en la misma ubicación "cuando exista segmentación" (§4), pero no define un motor de segmentación con datos propios — `GetRenderedMenuUseCase`/`findPublishedByLocation` resuelve esa ambigüedad eligiendo el `PUBLISHED` más recientemente actualizado por ubicación, un criterio simple y determinista; la segmentación real que sí está especificada (spec §2 "visibilidad por contexto") se resuelve con `visibilityRules` por ítem, no por menú.

## Versionado: snapshot completo, igual que CMS Pages y Blog

`NavigationVersion.snapshot` es un JSON completo (nombre, ubicación, estado, árbol completo de ítems en formato `tempId`/`parentTempId`) por versión — mismo criterio que `PageVersion`/`PostVersion`: reconstruir el árbol completo para poder restaurarlo. Restaurar no borra historial (crea una versión nueva) y no toca el `status` vigente del menú.

## Publicación vía el mismo `PATCH`, sin endpoint dedicado

A diferencia de CMS Pages/Blog (que tienen `POST /:id/publish` separado porque programan publicación futura), la spec de Navigation no menciona publicación programada — los endpoints mínimos (§7) no incluyen una ruta de publicación. `status` se cambia como cualquier otro campo del menú vía `PATCH /admin/navigation/menus/:id`.

## Caché del árbol resuelto, invalidada en cada escritura relevante

`NavigationCacheService` sigue el mismo patrón cache-aside que `CmsCacheService`/`BlogCacheService`: clave `navigation:public:render:{location}`, TTL de 60 s. Se cachea el árbol ya **resuelto** (rutas de recursos dinámicos calculadas, ítems con recurso eliminado ya descartados) — la visibilidad por contexto (`authenticated`/`device`) se filtra en cada solicitud sobre ese resultado cacheado, para no fragmentar la caché por combinación de contexto. Se invalida en `create`/`update`/`delete`/`restore` para la ubicación afectada (la anterior y la nueva, si cambió).

En el storefront, el `fetch` de `SiteNavigation` hereda el `revalidate = 60` del layout raíz (mismo valor que el TTL de Redis) — sin esto, el cache-por-defecto de `fetch` en Next.js serviría una copia indefinidamente vieja por encima de una caché de backend que sí se invalida correctamente; se confirmó este problema en vivo (un ítem nuevo no aparecía en el storefront tras guardarlo hasta agregar `revalidate`) y se corrigió antes de cerrar el sprint.

## Endpoints

| Método | Ruta                                                          | Auth             | Descripción                                                          |
| ------ | ------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------- |
| GET    | `/navigation/render/:location`                                | Público          | Árbol resuelto y cacheado de la ubicación; `?authenticated=&device=` |
| GET    | `/admin/navigation/menus`                                     | `admin:access`   | Listado paginado, filtrable por `location`/`status`                  |
| POST   | `/admin/navigation/menus`                                     | `catalog:manage` | Crea un menú (con su árbol de ítems) y la versión #1                 |
| GET    | `/admin/navigation/menus/:id`                                 | `admin:access`   | Detalle completo con ítems                                           |
| PATCH  | `/admin/navigation/menus/:id`                                 | `catalog:manage` | Actualiza nombre/ubicación/estado/ítems; crea una nueva versión      |
| DELETE | `/admin/navigation/menus/:id`                                 | `catalog:manage` | Elimina el menú e invalida su caché                                  |
| GET    | `/admin/navigation/menus/:id/versions`                        | `admin:access`   | Historial de versiones, paginado                                     |
| POST   | `/admin/navigation/menus/:id/versions/:versionNumber/restore` | `catalog:manage` | Restaura el árbol de una versión anterior                            |

Las mutaciones usan `catalog:manage` — mismo criterio que CMS Pages (026), Blog (027), Home Sections (013) y SEO (012).

## Auditoría

`AuditLogRepositoryPort` registra: `navigation.menu.created`, `navigation.menu.updated`, `navigation.menu.deleted`, `navigation.menu.version_restored`.

## SDK

- `packages/sdk/src/navigation.types.ts`: `NavigationMenu`, `NavigationItem`, `NavigationVersion`, `RenderedNavigationItem`, inputs de creación/actualización.
- `api-client.ts`: `renderNavigationMenu`, más el CRUD admin de menús y versionado.

## Frontend

- **Admin**: `/navigation-menus` — listado. `/navigation-menus/new` — creación mínima (nombre + ubicación). `/navigation-menus/:id` — Navigation Builder: Tree Editor (lista plana con selector de "Padre" y orden numérico — compensación deliberada frente a arrastrar y soltar real, mismo criterio que el editor de bloques JSON de CMS Pages), Link Picker (tipo + URL/id de recurso según el tipo), Visibility Rules Editor (sesión requerida/anónima, dispositivos), Live Preview (árbol anidado en memoria, antes de guardar) y Version History con restaurar.
- **Storefront**: `SiteNavigation` (componente de servidor reutilizable) integrado en el layout raíz para las ubicaciones `header` y `footer` — sin cambios estructurales en Home (013)/CMS Pages (026)/Blog (027), que ya se benefician de la navegación global. Ítems de nivel superior con hijos de un solo nivel se muestran como dropdown; con dos niveles, como mega menú por columnas.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): un administrador de prueba (rol `ADMIN`, con `catalog:manage`), un cliente de prueba y una categoría real.

**Por API (curl)**: creación de un menú con jerarquía (nivel raíz → dropdown → enlace dinámico `CATEGORY`); una categoría inexistente devuelve `400 NAVIGATION_TARGET_NOT_FOUND`; un árbol de 4 niveles devuelve `400 NAVIGATION_DEPTH_EXCEEDED` (máximo 3); el render público antes de publicar responde `[]`; tras publicar (`PATCH status`), el render resuelve el ítem `CATEGORY` a su ruta pública real; agregar una regla de visibilidad `authenticated: true` a un ítem lo retira del render sin contexto y lo devuelve con `?authenticated=true` (caché invalidada de inmediato); el historial de versiones acumula una versión por creación/actualización/restauración; restaurar la versión 1 revierte el árbol pero mantiene el `status` `PUBLISHED` vigente; ocultar la categoría enlazada hace que el ítem correspondiente desaparezca del render sin romper sus hermanos; eliminar el menú deja el render en `[]`; endpoints admin sin token devuelven `401`, con token de cliente (sin `admin:access`) devuelven `403`. El log de auditoría registra `navigation.menu.created`, `.updated`, `.version_restored` y `.deleted`.

**Por navegador**: en `apps/admin`, `/navigation-menus` muestra el listado real; `/navigation-menus/:id` permite agregar un ítem nuevo por el Tree Editor, verlo reflejado de inmediato en el Live Preview, guardarlo (confirmado: "Cambios guardados" y una versión nueva en el historial) y restaurar una versión anterior. En el storefront, el layout raíz renderiza el menú `header` con la jerarquía real (enlace simple + dropdown con el enlace de categoría resuelto), confirmado por la estructura del DOM.

Toda la data de prueba (administrador, cliente, menú, categoría) se eliminó de Railway al finalizar.

## Alcance diferido

- **Drag & drop real en el Tree Editor** — se reordena con un campo "Orden" numérico y se reparenta con un `<select>` de "Padre", en vez de arrastrar visualmente los nodos; mismo tipo de compensación que el editor de bloques JSON de CMS Pages (026) frente a un editor completamente visual.
- **Motor de segmentación por menú** — la spec menciona "permitir múltiples menús activos por ubicación cuando exista segmentación" sin definir el modelo de esa segmentación (¿por país? ¿por tipo de cliente?); se resolvió con el menú más reciente por ubicación como criterio determinista, y la única segmentación con datos concretos en la spec (visibilidad por contexto) se implementó a nivel de ítem.
- **SSG/ISR granular por ubicación de menú** — el storefront usa el `revalidate` del layout raíz (60 s, igual al TTL de Redis) en vez de una revalidación bajo demanda disparada por el propio guardado del menú.
