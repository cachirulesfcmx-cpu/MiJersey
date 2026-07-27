# Arquitectura del repositorio

La arquitectura de negocio (DDD, Clean Architecture, capas) está definida en
[`docs/prompts/04-ARCHITECTURE.md`](prompts/04-ARCHITECTURE.md). Este documento
describe únicamente cómo está organizado el **repositorio**, actualizado
conforme cada sprint agrega piezas (001 — Foundation & Bootstrap, 003 —
Authentication & Authorization, ...).

## Monorepo

pnpm Workspaces + Turborepo. Cada app y paquete es un workspace independiente
con su propio `package.json`, `tsconfig.json` y configuración de lint.

```
apps/
  web/      Next.js App Router — storefront público (puerto 3000)
  admin/    Next.js App Router — panel administrativo (puerto 3001)
  api/      NestJS — API HTTP (puerto 4000)

packages/
  ui/               Componentes React reutilizables (consumidos por web y admin)
  design-tokens/    Tokens de diseño (color, espaciado, tipografía) + preset de Tailwind
  config/           loadEnv(): validación de variables de entorno con Zod
  sdk/               Cliente HTTP tipado para consumir la API desde web/admin
  shared-types/     Tipos de infraestructura compartidos (errores, paginación, salud)
  shared-utils/     Utilidades genéricas (Result, assert, sleep)

infra/
  docker/   Un Dockerfile multi-stage por app (patrón turbo prune + standalone)
  nginx/    Reverse proxy para el entorno local (docker-compose)
  scripts/  Scripts de mantenimiento del entorno

docs/       Documentación del proyecto (este árbol) + specs en docs/prompts/
```

## Dependencias entre paquetes

```
apps/web   -> @mijersey/ui, @mijersey/design-tokens, @mijersey/sdk, @mijersey/shared-types, @mijersey/config
apps/admin -> @mijersey/ui, @mijersey/design-tokens, @mijersey/sdk, @mijersey/shared-types, @mijersey/config
apps/api   -> @mijersey/config, @mijersey/shared-types
@mijersey/sdk -> @mijersey/shared-types
```

Ningún paquete de `packages/` depende de una app. Las apps no se importan entre sí.

## Configuración

Ninguna app ni paquete lee `process.env` directamente fuera de su módulo de
configuración. Cada app define su propio schema de Zod y lo valida con
`loadEnv()` de `@mijersey/config` al arrancar; si falta o es inválida una
variable, la app falla inmediatamente con un error explícito en vez de
arrancar en un estado inconsistente.

## Backend (`apps/api`)

- **Config module** (global): expone `AppConfig` tipado vía el token `APP_CONFIG`.
- **PrismaModule / RedisModule** (globales): exponen clientes tipados y gestionan su ciclo de vida (`onModuleInit`/`onModuleDestroy`).
- **HealthModule**: expone `GET /health` (Terminus) verificando PostgreSQL y Redis.
- **HttpExceptionFilter** (global): uniforma toda respuesta de error al contrato `ApiErrorResponse` de `@mijersey/shared-types`, incluyendo `requestId` para correlación.
- **Logging**: `nestjs-pino`, con `x-request-id` generado o propagado por request para trazabilidad end-to-end.
- **IdentityModule** (`src/modules/identity`): primer módulo de dominio, con capas domain/application/infrastructure/presentation. `JwtAuthGuard` y `ThrottlerGuard` son globales (`APP_GUARD`); las rutas públicas se marcan con `@Public()`. Detalle completo en [authentication.md](authentication.md).
- **AdministrationModule** (`src/modules/administration`): importa `IdentityModule` para reusar `PermissionsGuard` y estadísticas de usuarios; es dueño de la lectura de auditoría (`AuditLogQueryPort`) sobre la tabla que Identity escribe. Detalle completo en [admin-dashboard.md](admin-dashboard.md).
- **CatalogModule** (`src/modules/catalog`): importa `IdentityModule` para `PermissionsGuard` y para auditar (`AUDIT_LOG_REPOSITORY`); expone `GetProductStatsUseCase` para que `AdministrationModule` reporte la métrica `products` del dashboard. Detalle completo en [product-catalog.md](product-catalog.md).
- **TaxonomyModule** (`src/modules/taxonomy`): categorías jerárquicas y colecciones manuales/inteligentes. Importa `IdentityModule` igual que Catalog; no importa `CatalogModule` — accede a `products` mediante su propio `ProductQueryPort` de solo lectura (mismo patrón CQRS que `AuditLogQueryPort` en Administration), evitando acoplar el dominio de Catalog al concepto de "reglas de colección". Detalle completo en [categories-collections.md](categories-collections.md).
- **Opciones y variantes de producto**: a diferencia de Taxonomy, viven dentro del propio `CatalogModule` (no un módulo nuevo) porque son parte estructural del agregado `Product`, no un concepto organizacional aparte. Detalle completo en [product-variants.md](product-variants.md).

## Frontend (`apps/web`, `apps/admin`)

- App Router, Server Components donde no se requiera interactividad.
- Tailwind CSS configurado con el preset de `@mijersey/design-tokens` (una sola fuente de verdad para color/espaciado/tipografía entre ambas apps).
- `output: 'standalone'` en `next.config.mjs` para imágenes Docker mínimas.

## Docker

Cada Dockerfile usa `turbo prune --docker` para aislar solo los paquetes que
la app necesita antes de instalar dependencias, maximizando el cacheo de
capas. `docker-compose.yml` orquesta las 6 piezas mínimas (web, admin, api,
postgres, redis, nginx) en una red compartida, arrancable con un único
comando (`docker compose up`).
