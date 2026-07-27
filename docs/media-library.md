# Media Library

Implementación de [`docs/prompts/010-Media-Library.md`](prompts/010-Media-Library.md). Vive en su propio módulo (`apps/api/src/modules/media`), sin importar ningún módulo existente: `MediaAsset`/`Folder`/`AssetTag`/`MediaAssetUsage` son entidades propias, y el único punto de contacto con otros módulos es de salida — `MediaModule` exporta `MediaUsageService` para que consumidores futuros (011-Brands, CMS, Blog) registren/quiten referencias sin que Media Library conozca su dominio.

## Modelo de dominio

- **MediaAsset**: `filename`/`storageKey` (nombre físico único generado), `originalName` (nombre subido por el usuario), `mimeType`, `type` (`IMAGE`|`VIDEO`|`DOCUMENT`, derivado del mime type), `size`, `width`/`height`/`duration` (extraídos automáticamente para imágenes; `duration` queda `null` — ver "Alcance diferido"), `contentHash` (SHA-256, único), `url`/`thumbnailUrl`, `status` (`ACTIVE`|`ARCHIVED`), `folderId`, `tags`.
- **Folder**: árbol simple (`parentId` autoreferencial), `slug` único global. Mismo patrón de prevención de ciclos que Category (006), sin límite de profundidad (el spec no lo pide para Media).
- **AssetTag**: `name`/`slug` únicos, libres — se crean sobre la marcha al subir/editar un archivo (`findOrCreateByNames`), igual que las etiquetas de un blog típico.
- **MediaAssetUsage**: referencia genérica `(mediaAssetId, referenceType, referenceId)` — mismo patrón que `InventoryMovement.referenceType/referenceId` (009). Es la única vía por la que otro módulo declara "estoy usando este archivo"; `DELETE /admin/media/:id` se bloquea mientras existan filas aquí.

## Deduplicación (spec §5, "no duplicar archivos idénticos")

Cada subida calcula el SHA-256 del contenido (`UploadMediaUseCase`) y busca primero por `contentHash` (`findByContentHash`, respaldado por el `@unique` de la columna). Si ya existe un asset con el mismo hash, la subida devuelve ese asset existente sin tocar el almacenamiento ni crear una fila nueva — subir el mismo archivo dos veces es una operación idempotente en la práctica.

## Almacenamiento desacoplado (spec §7)

`StoragePort` (`save`/`delete`/`resolvePath`) es la única superficie que los casos de uso conocen; `LocalDiskStorageAdapter` es la implementación de hoy (escribe en `MEDIA_UPLOADS_DIR`, sirviendo el contenido vía `app.useStaticAssets()` bajo el prefijo `/uploads`). Cambiar a un adaptador de S3/objeto remoto no requiere tocar ningún caso de uso, solo el `provide: STORAGE_PORT` en `media.module.ts`.

`helmet` se configura con `crossOriginResourcePolicy: 'cross-origin'` porque `apps/web`/`apps/admin` son orígenes distintos de la API y necesitan poder cargar `<img src="...">` desde ella; con la política por defecto (`same-origin`) el navegador bloquea esas cargas.

## Procesamiento (spec §6)

`MediaProcessingService` usa `sharp` para imágenes: extrae `width`/`height` y genera una miniatura (máx. 400×400, formato WebP) guardada como un segundo archivo vía `StoragePort`. Video y documentos no se procesan (extraer duración de video requiere `ffprobe`, fuera de alcance de este entorno) — quedan con `width`/`height`/`duration`/`thumbnailUrl` en `null`, campos ya contemplados como opcionales en el modelo mínimo del spec (§3).

El procesamiento ocurre **antes** de guardar el archivo original: si `sharp` no puede decodificar la imagen (archivo corrupto), la subida falla con `InvalidUploadError` (400) sin dejar un archivo huérfano en el almacenamiento. La firma de `process()` es síncrona hoy, pero no depende de nada del ciclo de vida HTTP — despacharla a una cola en el futuro (spec §7, "procesamiento asíncrono preparado para colas futuras") no requeriría cambiar a quien la llama.

## Endpoints

| Método | Ruta                      | Permiso          | Descripción                                                           |
| ------ | ------------------------- | ---------------- | --------------------------------------------------------------------- |
| GET    | `/admin/media`            | `admin:access`   | Lista paginada; filtros por búsqueda, carpeta, tipo, estado, etiqueta |
| GET    | `/admin/media/tags`       | `admin:access`   | Lista de todas las etiquetas                                          |
| GET    | `/admin/media/:id`        | `admin:access`   | Detalle                                                               |
| POST   | `/admin/media/upload`     | `catalog:manage` | Sube un archivo (`multipart/form-data`); dedup por hash               |
| PATCH  | `/admin/media/:id`        | `catalog:manage` | Edita metadatos (título, alt, carpeta, estado, etiquetas)             |
| DELETE | `/admin/media/:id`        | `catalog:manage` | Borrado físico; bloqueado (409) si hay referencias de uso             |
| GET    | `/admin/folders`          | `admin:access`   | Árbol completo de carpetas                                            |
| POST   | `/admin/folders`          | `catalog:manage` | Alta                                                                  |
| PATCH  | `/admin/folders/:id`      | `catalog:manage` | Renombrar                                                             |
| PATCH  | `/admin/folders/:id/move` | `catalog:manage` | Mover a otro padre (bloqueado si forma un ciclo)                      |
| DELETE | `/admin/folders/:id`      | `catalog:manage` | Bloqueado si tiene subcarpetas o archivos (409)                       |

`GET /admin/media/tags` se declara antes que `GET /admin/media/:id` en el controlador para que Express no confunda `tags` con un id (mismo caso que 005/006/007/008/009).

## Errores mapeados (`MediaExceptionFilter`)

| Error                          | HTTP | Motivo                                                       |
| ------------------------------ | ---- | ------------------------------------------------------------ |
| `MediaAssetNotFoundError`      | 404  | —                                                            |
| `UnsupportedMediaTypeError`    | 400  | Mime type fuera de la lista soportada (spec §4)              |
| `MediaAssetInUseError`         | 409  | Tiene referencias de uso registradas                         |
| `InvalidUploadError`           | 400  | Falta el archivo, o está dañado/no se pudo procesar          |
| `FolderNotFoundError`          | 404  | —                                                            |
| `FolderSlugAlreadyExistsError` | 409  | —                                                            |
| `FolderCycleError`             | 400  | Se intenta mover una carpeta bajo sí misma o un descendiente |
| `FolderNotEmptyError`          | 409  | Tiene subcarpetas o archivos                                 |

## Auditoría

Namespace `media.asset.*` y `media.folder.*` (creado/actualizado/eliminado/movido), registrado vía el mismo `AuditLogRepositoryPort` compartido de Identity.

## Permisos

Reutiliza `admin:access` (lecturas) y `catalog:manage` (escrituras) — no se creó un permiso `media:manage` dedicado, siguiendo el mismo criterio que Taxonomy/Variants/Attributes/Inventory.

## Integración con otros módulos (`MediaUsageService`)

`MediaModule` exporta `MediaUsageService` (no una ruta HTTP) para que otro módulo la inyecte directamente y llame a `recordUsage(mediaAssetId, referenceType, referenceId)` / `removeUsage(...)` — el mismo patrón por el que `AttributesModule` exporta `SearchProductsUseCase` para que `CatalogModule` lo use. Esto es lo que 011-Brands consumirá para `logoMediaId`/`coverMediaId`, y lo que 026-CMS-Pages/027-Blog reutilizarán sin que Media Library necesite conocer sus modelos de dominio.

## Frontend (`apps/admin`)

- **`/media`**: explorador de archivos con árbol de carpetas (`FolderTree`, crear/eliminar carpetas inline), carga por arrastrar-y-soltar o selector de archivos, búsqueda y filtros (tipo, estado), vistas de cuadrícula y lista, selección múltiple con borrado masivo, y un panel lateral (`MediaEditorPanel`) para editar título/alt/carpeta/etiquetas/estado con previsualización de la miniatura.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): creación de carpeta → subida de una imagen real (verificado `width`/`height` extraídos y miniatura WebP generada y servible vía `/uploads`) → subida del mismo archivo (mismo `id` devuelto, sin duplicar fila ni archivo) → registro de una referencia de uso simulada → intento de borrado bloqueado (409 `MEDIA_ASSET_IN_USE`) → remoción de la referencia → borrado exitoso (204, archivo original y miniatura eliminados del disco) → prevención de ciclo al mover una carpeta bajo sí misma (400 `FOLDER_CYCLE`) → edición de metadatos (alt text, archivado) → filtro por estado → listado de etiquetas → subida de un archivo corrupto (confirmado 400 `INVALID_UPLOAD` limpio, sin dejar huérfanos en el almacenamiento — bug encontrado y corregido durante esta verificación, ver más abajo). Todos los datos de prueba (usuario, archivos, carpeta) se eliminaron de Railway y del disco al finalizar.

### Bug encontrado y corregido durante la verificación

Un archivo de imagen corrupto hacía que `sharp` fallara dentro de `MediaProcessingService`, y como el `HttpExceptionFilter` global no registra el detalle de excepciones no tipadas, el cliente solo veía un 500 genérico. Se corrigieron dos cosas: (1) `MediaProcessingService.process` ahora atrapa cualquier fallo de `sharp` y lo traduce a `InvalidUploadError` (400, con mensaje claro); (2) `UploadMediaUseCase` ahora procesa el archivo **antes** de guardarlo, así un archivo dañado nunca llega a escribirse en `StoragePort`. También se corrigió que `DeleteMediaUseCase` no borraba el archivo de la miniatura (solo el original) — ahora borra ambos.

## Alcance diferido

No se integra código con 005-Product-Catalog/012-Product-SEO/013-Storefront-Home/015-Product-Detail/026-CMS-Pages/027-Blog en este sprint — la Definition of Done pide que la integración sea posible "sin cambios estructurales", lo cual queda garantizado por `MediaAssetUsage` + `MediaUsageService`, no por cablear ya esos módulos (ninguno de ellos existe todavía salvo Product Catalog, que no pidió esta integración en su propio sprint). Tampoco hay CDN ni DAM externo (explícitamente fuera de alcance, spec §2), ni extracción de duración de video (requiere `ffprobe`).
