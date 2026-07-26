# Variables de entorno

Cada app valida sus propias variables al arrancar (`src/config/env.ts` en
`web`/`admin`, `src/config/env.schema.ts` en `api`) usando `@mijersey/config`.
Si falta una variable requerida o tiene un formato inválido, la app no
arranca y muestra el detalle del error.

## `apps/api`

| Variable                    | Requerida | Default                 | Descripción                                                                                |
| --------------------------- | --------- | ----------------------- | ------------------------------------------------------------------------------------------ |
| `NODE_ENV`                  | No        | `development`           | `development` \| `test` \| `production`                                                    |
| `PORT`                      | No        | `4000`                  | Puerto HTTP de la API                                                                      |
| `DATABASE_URL`              | **Sí**    | —                       | Cadena de conexión de PostgreSQL                                                           |
| `REDIS_URL`                 | **Sí**    | —                       | Cadena de conexión de Redis                                                                |
| `CORS_ORIGIN`               | No        | `http://localhost:3000` | Origen permitido por CORS                                                                  |
| `LOG_LEVEL`                 | No        | `info`                  | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace`                               |
| `ENABLE_SWAGGER`            | No        | `false`                 | Reservado para habilitar documentación OpenAPI en un módulo futuro                         |
| `JWT_ACCESS_SECRET`         | **Sí**    | —                       | Secreto para firmar los access tokens (JWT). Mínimo 32 caracteres                          |
| `PUBLIC_WEB_URL`            | No        | `http://localhost:3000` | URL pública del storefront, usada para construir enlaces de verificación/recuperación      |
| `SEED_SUPER_ADMIN_EMAIL`    | No        | —                       | Si se define junto con `SEED_SUPER_ADMIN_PASSWORD`, `pnpm prisma:seed` crea un Super Admin |
| `SEED_SUPER_ADMIN_PASSWORD` | No        | —                       | Contraseña del Super Admin creado por el seed                                              |

## `apps/web` y `apps/admin`

| Variable              | Requerida | Default                 | Descripción                                      |
| --------------------- | --------- | ----------------------- | ------------------------------------------------ |
| `NODE_ENV`            | No        | `development`           | Definida automáticamente por Next.js             |
| `NEXT_PUBLIC_API_URL` | No        | `http://localhost:4000` | URL base de la API consumida por `@mijersey/sdk` |

## Plantillas

Cada app incluye su `.env.example`. Nunca se versiona un `.env` real
(ver `.gitignore`); los secretos de producción se gestionan en Vercel/Railway,
no en el repositorio.
