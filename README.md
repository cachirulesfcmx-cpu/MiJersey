# MiJersey

Plataforma eCommerce propietaria, desarrollada bajo la [Engineering Constitution](docs/prompts/00-CONSTITUTION.md) del proyecto.

## Estado

Sprints **001 — Foundation & Bootstrap**, **002 — DevOps Workspace**, **003 — Authentication & Authorization**, **004 — Admin Dashboard**, **005 — Product Catalog** y **006 — Categories & Collections** completados: monorepo funcional con CI, hooks de calidad, el dominio Identity (registro, login, sesiones con rotación, RBAC, recuperación y verificación de correo), el panel administrativo (dashboard con KPIs, gestión de usuarios/roles, auditoría, perfil), el catálogo de productos (CRUD, publicación, duplicado, eliminación lógica, acciones masivas, API pública) y la organización del catálogo en categorías jerárquicas y colecciones manuales/inteligentes. El desarrollo continúa módulo por módulo siguiendo las especificaciones en `docs/prompts/`.

## Stack

- **Frontend:** Next.js (App Router), React, TypeScript estricto, Tailwind CSS
- **Backend:** NestJS, Prisma, PostgreSQL, Redis
- **Monorepo:** pnpm Workspaces + Turborepo
- **Infraestructura:** Docker, Nginx, Vercel, Railway

## Estructura

```
apps/
  web/      Storefront (Next.js, puerto 3000)
  admin/    Panel administrativo (Next.js, puerto 3001)
  api/      API (NestJS, puerto 4000)

packages/
  ui/               Componentes reutilizables
  design-tokens/    Tokens de diseño + preset de Tailwind
  config/           Carga y validación tipada de variables de entorno (Zod)
  sdk/              Cliente tipado para consumir la API
  shared-types/     Tipos compartidos (sin entidades de dominio)
  shared-utils/     Utilidades genéricas

infra/
  docker/   Dockerfiles de cada app
  nginx/    Reverse proxy para el entorno local
  scripts/  Scripts de mantenimiento

docs/       Documentación del proyecto y especificaciones (docs/prompts/)
```

## Inicio rápido

Ver [docs/installation.md](docs/installation.md) para la guía completa. Resumen:

```bash
pnpm install
docker compose up
```

## Documentación

- [Guía de instalación](docs/installation.md)
- [Guía de desarrollo](docs/development.md)
- [Guía de contribución](docs/contributing.md)
- [Flujo de Git](docs/git-workflow.md)
- [Arquitectura del repositorio](docs/architecture.md)
- [Autenticación y autorización](docs/authentication.md)
- [Panel administrativo](docs/admin-dashboard.md)
- [Catálogo de productos](docs/product-catalog.md)
- [Categorías y colecciones](docs/categories-collections.md)
- [Variantes de producto](docs/product-variants.md)
- [Atributos y filtros](docs/attributes-filters.md)
- [Variables de entorno](docs/environment-variables.md)
- [Comandos disponibles](docs/commands.md)

## Infraestructura del proyecto

| Servicio | Propósito                             |
| -------- | ------------------------------------- |
| GitHub   | Control de versiones                  |
| Vercel   | Despliegue de frontend (web/admin)    |
| Railway  | Despliegue de API, PostgreSQL y Redis |
