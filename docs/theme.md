# Theme Settings

Implementación de [`docs/prompts/029-Theme-Settings.md`](prompts/029-Theme-Settings.md). Módulo nuevo (`apps/api/src/modules/theme`) que centraliza la identidad visual y los componentes globales del storefront (colores, tipografía, Header, Footer, Banners, Layout) sin tocar código ni CMS.

## Singleton real, no una colección

A diferencia de Page/Post/NavigationMenu (colecciones de muchas entidades), Theme es un único recurso por sitio (spec §4 "mantener una configuración activa por sitio"). `ThemeSettings` tiene como máximo una fila, creada perezosamente con `DEFAULT_THEME_SETTINGS` en el primer acceso — mismo criterio que `CustomerProfile`/`Wishlist` (019/020). `ThemeSection` tiene una fila por cada valor del enum `ThemeSectionKey` (`HEADER`/`FOOTER`/`BANNER`/`LAYOUT`), con `@@unique([section])`.

## `section` como enum cerrado, no un string libre

A diferencia de `NavigationMenu.location` (string libre porque su spec habla de "múltiples ubicaciones" sin enumerarlas), la spec de Theme sí enumera un conjunto fijo y completo de secciones (§2/§3: Header, Footer, Banners globales, Layouts) — por eso `ThemeSectionKey` es un enum tanto en Prisma como en el dominio, no un string abierto.

## Borrador y publicación: sin campo `status`, con dos fuentes de lectura distintas

Page/Post/NavigationMenu resuelven borrador-vs-publicado con un campo `status` en la misma fila. Theme no lo necesita: la única fila de `ThemeSettings` (más sus `ThemeSection`) **es** el borrador, editado directamente por `PATCH /admin/theme`. Lo "publicado" no es un estado de esa fila sino una copia completa (`ThemeStateView`) guardada en una clave de Redis (`theme:public:published`), escrita únicamente por `POST /admin/theme/publish`. Esto separa limpiamente las dos lecturas de la spec:

- `GET /admin/theme` (realiza el `GET /theme/preview` de la spec §7) — siempre el borrador vigente, leído directo de Postgres.
- `GET /theme` (público) — siempre la caché, con una única excepción: si nunca se ha publicado (instalación nueva), sirve el borrador actual y **siembra** la caché con él, para que el storefront nunca quede sin tema (spec §12 implícito en "el storefront refleje la configuración activa"); después de esa siembra inicial, solo una publicación explícita la vuelve a escribir.

## Caché sin TTL: la excepción a la familia cache-aside del proyecto

`TaxonomyCacheService` (006), `CmsCacheService` (026), `BlogCacheService` (027) y `NavigationCacheService` (028) usan todas TTL de 60 s porque cachean contenido por slug/ubicación que podría volverse obsoleto por escrituras externas a esa clave puntual. `ThemeCacheService` rompe el patrón a propósito: usa `redis.client.set()` sin expiración, porque la única clave (`theme:public:published`) tiene un único escritor (`PublishThemeUseCase`) — no hay drift externo del que protegerse, así que un TTL solo generaría cache-misses innecesarios (spec §8 "invalidación selectiva": invalidar solo cuando cambia, no por vencimiento).

## Versionado global, sin FK a una entidad padre

`ThemeVersion` es la primera tabla de versiones del proyecto sin `parentId` — `PageVersion`/`PostVersion`/`NavigationVersion` sí lo tienen porque versionan una entidad entre muchas. Como Theme es un singleton, `versionNumber` es simplemente global y secuencial (`@unique`, sin `menuId`/`pageId` compuesto). Se crea una versión en cada `PATCH` y en cada publicación — así el historial distingue "guardé cambios" de "publiqué este estado exacto".

Restaurar (mismo criterio que 026/027/028): aplica el snapshot elegido al borrador y crea una versión **nueva** a partir de él, pero nunca toca la caché pública — solo una publicación explícita hace visibles los cambios restaurados en el storefront. Esta invariante está garantizada estructuralmente en `RestoreThemeVersionUseCase`, que ni siquiera recibe `ThemeCacheService` como dependencia.

## Endpoints

| Método | Ruta                                           | Auth             | Descripción                                                                       |
| ------ | ---------------------------------------------- | ---------------- | --------------------------------------------------------------------------------- |
| GET    | `/theme`                                       | Público          | Tema publicado (caché); si nunca se publicó, siembra con el borrador              |
| GET    | `/admin/theme`                                 | `admin:access`   | Borrador vigente (settings + secciones) — realiza `GET /theme/preview` de la spec |
| PATCH  | `/admin/theme`                                 | `catalog:manage` | Actualiza settings y/o secciones del borrador; crea una versión                   |
| POST   | `/admin/theme/publish`                         | `catalog:manage` | Copia el borrador a la caché pública; crea una versión                            |
| GET    | `/admin/theme/versions`                        | `admin:access`   | Historial de versiones, paginado                                                  |
| POST   | `/admin/theme/versions/:versionNumber/restore` | `catalog:manage` | Aplica un snapshot anterior al borrador (no publica)                              |

Mutaciones bajo `catalog:manage`, lecturas bajo `admin:access` — mismo criterio que CMS Pages (026), Blog (027) y Navigation (028).

## Validación de secciones

`validateThemeSectionConfig` (dominio, switch por `ThemeSectionKey`) — mismo criterio minimalista que `validateHomeSectionConfig` (013) y `validatePageBlockConfig` (026): valida forma mínima, no un JSON Schema completo. `BANNER` requiere `message` no vacío; `FOOTER.columns`, si viene, debe ser un arreglo de `{ title, links[] }`; `HEADER`/`LAYOUT` no tienen campos obligatorios. Se ejecuta en `UpdateThemeUseCase` antes de tocar la base de datos — una sección inválida no llega a persistirse ni genera una versión.

## Auditoría

`AuditLogRepositoryPort` registra: `theme.updated` (con las claves de `settings` y las `sections` tocadas), `theme.published`, `theme.version_restored`.

## SDK

- `packages/sdk/src/theme.types.ts`: `ThemeState`, `ThemeSettings`, `ThemeSection`, `ThemeVersion`, `UpdateThemeInput` y sus tipos anidados.
- `api-client.ts`: `getPublishedTheme`, `getAdminTheme`, `updateTheme`, `publishTheme`, `listThemeVersions`, `restoreThemeVersion`.

## Frontend

- **Admin**: `/theme` — Theme Dashboard de una sola página: Color Picker (inputs `type="color"` + hex) y Typography Settings para `ThemeSettings`; Header Editor, Footer Editor (columnas y enlaces dinámicos), Banner Manager y Layout, cada uno con su propio toggle "Sección activa"; Live Preview en línea que renderiza header/banner/footer con los colores y el mensaje actuales del formulario (antes de guardar); botón "Publicar" separado de "Guardar borrador"; historial de versiones con "Restaurar".
- **Storefront**: `SiteTheme` (componente de servidor) integrado al inicio del `<body>` en el layout raíz — inyecta un `<style>` con las variables CSS (`--color-primary`, `--color-secondary`, `--font-family-theme`, `--border-radius-theme`, `--spacing-scale-theme`) leídas de `GET /theme`, y renderiza el banner global si la sección `BANNER` está `enabled` y tiene `message`. Hereda el `revalidate = 60` ya declarado en el layout raíz (mismo mecanismo que `SiteNavigation`, 028).

## Verificación en vivo

Contra Railway (Postgres + Redis reales), con un administrador de prueba (`catalog:manage`/`admin:access`):

**Por API (curl)**: `GET /admin/theme` en la primera visita crea el singleton con `DEFAULT_THEME_SETTINGS`; `PATCH /admin/theme` (settings + secciones `BANNER`/`HEADER`) actualiza el borrador sin afectar `GET /theme` público; `POST /admin/theme/publish` copia el borrador a la caché y `GET /theme` refleja el cambio de inmediato; una segunda edición del borrador sin publicar deja `GET /theme` intacto; `POST /admin/theme/versions/:n/restore` revierte el borrador a un estado anterior mientras `GET /theme` sigue mostrando lo último publicado — confirmando en vivo que "restaurar nunca republica"; una sección `BANNER` sin `message` devuelve `400 INVALID_THEME_SECTION`; una versión inexistente devuelve `404 THEME_VERSION_NOT_FOUND`; sin token, `401`. El log de auditoría registra `theme.updated`, `theme.published` y `theme.version_restored`.

**Por navegador**: en `apps/admin`, `/theme` carga el borrador real, muestra el historial de versiones acumulado y permite editar/guardar/publicar/restaurar desde la UI. En `apps/web`, la home aplica `--color-primary` vía `getComputedStyle` sobre `:root`, y activar+publicar una sección `BANNER` la muestra de inmediato en el storefront (verificado visualmente tras reiniciar el servidor de desarrollo para descartar la caché de `fetch` de Next.js, mismo procedimiento que Navigation, 028).

Toda la data de prueba (administrador, valores temporales de settings/secciones) se restauró a los valores por defecto en Railway al finalizar; el historial de versiones generado durante la verificación se dejó intacto, igual que en los módulos anteriores.

## Alcance diferido

- **Validación de archivos de imagen** (spec §9 "validación de archivos") — `logo`/`favicon` se validan como URL (`@IsUrl()`), no se implementó un flujo de subida/validación de binarios propio de Theme; el proyecto ya cuenta con Media Library (010) para ese caso de uso.
- **Configuración responsive dedicada** (spec §2) — no se agregó un campo o sección específica para breakpoints; `LayoutSectionConfig` cubre `containerWidth`/`headerStyle` como los "campos mínimos" razonables para layout, y el storefront ya es responsive por Tailwind en todas las páginas existentes.
