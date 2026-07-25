# Comandos disponibles

Todos los comandos se ejecutan desde la raíz del monorepo salvo que se indique lo contrario.

## Workspace (Turborepo)

| Comando             | Descripción                                                  |
| ------------------- | ------------------------------------------------------------ |
| `pnpm dev`          | Levanta todas las apps y paquetes en modo desarrollo (watch) |
| `pnpm build`        | Compila todas las apps y paquetes                            |
| `pnpm start`        | Arranca las apps ya compiladas                               |
| `pnpm lint`         | Ejecuta ESLint en todo el workspace                          |
| `pnpm typecheck`    | Verifica tipos sin emitir output                             |
| `pnpm test`         | Ejecuta las pruebas de cada paquete/app                      |
| `pnpm format`       | Formatea el código con Prettier                              |
| `pnpm format:check` | Verifica formato sin modificar archivos                      |
| `pnpm clean`        | Limpia builds y `node_modules`                               |
| `pnpm cache:clean`  | Limpia solo la caché local de Turborepo                      |

## Prisma (`apps/api`)

| Comando                | Descripción                             |
| ---------------------- | --------------------------------------- |
| `pnpm prisma:generate` | Regenera el cliente tipado de Prisma    |
| `pnpm prisma:migrate`  | Crea/aplica una migración en desarrollo |
| `pnpm prisma:seed`     | Ejecuta el script de seed               |

## Filtrar por paquete o app

```bash
pnpm --filter @mijersey/api <script>
pnpm --filter @mijersey/web <script>
```

## Docker

| Comando                               | Descripción                                                   |
| ------------------------------------- | ------------------------------------------------------------- |
| `docker compose up`                   | Levanta web, admin, api, postgres, redis y nginx              |
| `docker compose up postgres redis -d` | Levanta solo las dependencias, para desarrollo con `pnpm dev` |
| `docker compose down`                 | Detiene todos los servicios                                   |
| `./infra/scripts/docker-reset.sh`     | Detiene, elimina volúmenes y reconstruye todo desde cero      |
