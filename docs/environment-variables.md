# Variables de entorno

Cada app valida sus propias variables al arrancar (`src/config/env.ts` en
`web`/`admin`, `src/config/env.schema.ts` en `api`) usando `@mijersey/config`.
Si falta una variable requerida o tiene un formato inválido, la app no
arranca y muestra el detalle del error.

## `apps/api`

| Variable                    | Requerida | Default                                       | Descripción                                                                                                                                     |
| --------------------------- | --------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                  | No        | `development`                                 | `development` \| `test` \| `production`                                                                                                         |
| `PORT`                      | No        | `4000`                                        | Puerto HTTP de la API                                                                                                                           |
| `DATABASE_URL`              | **Sí**    | —                                             | Cadena de conexión de PostgreSQL                                                                                                                |
| `REDIS_URL`                 | **Sí**    | —                                             | Cadena de conexión de Redis                                                                                                                     |
| `CORS_ORIGIN`               | No        | `http://localhost:3000,http://localhost:3001` | Orígenes permitidos por CORS, separados por coma (web + admin)                                                                                  |
| `LOG_LEVEL`                 | No        | `info`                                        | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace`                                                                                    |
| `ENABLE_SWAGGER`            | No        | `false`                                       | Reservado para habilitar documentación OpenAPI en un módulo futuro                                                                              |
| `JWT_ACCESS_SECRET`         | **Sí**    | —                                             | Secreto para firmar los access tokens (JWT). Mínimo 32 caracteres                                                                               |
| `PUBLIC_WEB_URL`            | No        | `http://localhost:3000`                       | URL pública del storefront, usada para enlaces de verificación/recuperación de clientes                                                         |
| `PUBLIC_ADMIN_URL`          | No        | `http://localhost:3001`                       | URL pública del panel administrativo, usada para enlaces de invitación de staff                                                                 |
| `PUBLIC_API_URL`            | No        | `http://localhost:4000`                       | Origen absoluto de la propia API — usado para construir las URLs de los archivos de la Media Library (010), ya que web/admin son otros orígenes |
| `MEDIA_UPLOADS_DIR`         | No        | `uploads`                                     | Carpeta local donde `LocalDiskStorageAdapter` guarda los archivos subidos a la Media Library (010)                                              |
| `SEED_SUPER_ADMIN_EMAIL`    | No        | —                                             | Si se define junto con `SEED_SUPER_ADMIN_PASSWORD`, `pnpm prisma:seed` crea un Super Admin                                                      |
| `SEED_SUPER_ADMIN_PASSWORD` | No        | —                                             | Contraseña del Super Admin creado por el seed                                                                                                   |

## `apps/web` y `apps/admin`

| Variable              | Requerida | Default                 | Descripción                                                                                                                                                      |
| --------------------- | --------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`            | No        | `development`           | Definida automáticamente por Next.js                                                                                                                             |
| `NEXT_PUBLIC_API_URL` | No        | `http://localhost:4000` | URL base de la API consumida por `@mijersey/sdk`                                                                                                                 |
| `NEXT_PUBLIC_WEB_URL` | No        | `http://localhost:3000` | Origen público de `apps/web` (solo esa app) — usado como `metadataBase` y para construir URLs absolutas en el SEO del Blog (027: canonical, Open Graph, JSON-LD) |

## Plantillas

Cada app incluye su `.env.example`. Nunca se versiona un `.env` real
(ver `.gitignore`); los secretos de producción se gestionan en Vercel/Railway,
no en el repositorio.
