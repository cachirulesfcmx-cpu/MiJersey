# Guía de instalación

## Requisitos

- [Node.js](https://nodejs.org/) 20.x (ver [.nvmrc](../.nvmrc))
- [pnpm](https://pnpm.io/) 9.x (se activa vía `corepack`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (incluye Docker Compose)
- Git

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

## Clonar e instalar dependencias

```bash
git clone https://github.com/cachirulesfcmx-cpu/MiJersey.git
cd MiJersey
pnpm install
```

## Variables de entorno

Cada app define su propio `.env.example`. Cópialos a `.env` antes de ejecutar en local:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
```

Ver el detalle de cada variable en [environment-variables.md](environment-variables.md).

## Levantar la plataforma completa (Docker)

Un único comando levanta web, admin, api, PostgreSQL, Redis y Nginx:

```bash
docker compose up
```

| Servicio         | URL local                    |
| ---------------- | ---------------------------- |
| Storefront (web) | http://localhost:3000        |
| Admin            | http://localhost:3001        |
| API              | http://localhost:4000        |
| API vía Nginx    | http://localhost:8080/api/   |
| Health check     | http://localhost:4000/health |

Para reconstruir todo desde cero: `./infra/scripts/docker-reset.sh`.

## Levantar sin Docker (desarrollo con hot-reload)

Requiere PostgreSQL y Redis accesibles localmente (por ejemplo, solo esos dos servicios vía Docker):

```bash
docker compose up postgres redis -d
pnpm prisma:generate
pnpm dev
```

`pnpm dev` ejecuta en paralelo el `dev` de cada app y paquete (Turborepo), con recarga en caliente.

## Verificación

- `pnpm build` — compila todas las apps y paquetes.
- `pnpm lint` — valida el código de todo el workspace.
- `pnpm typecheck` — verifica tipos sin emitir.
- `pnpm test` — ejecuta las pruebas disponibles.
