# Guía de desarrollo

## Flujo de trabajo

1. Sincroniza `main` y crea una rama a partir de ella.
2. Instala dependencias con `pnpm install` en la raíz (nunca dentro de una app o paquete individual).
3. Ejecuta `pnpm dev` para levantar todo el workspace en modo desarrollo.
4. Antes de hacer commit, Husky ejecuta automáticamente `lint-staged` (ESLint + Prettier sobre los archivos modificados) y luego `pnpm typecheck` sobre todo el workspace. El commit se bloquea si algo falla.
5. El mensaje del commit se valida con `commitlint` (`commit-msg` hook) siguiendo Conventional Commits — ver [git-workflow.md](git-workflow.md).

> La estrategia de ramas y convenciones de commits están detalladas en [git-workflow.md](git-workflow.md) y el checklist de contribución en [contributing.md](contributing.md), implementados en `docs/prompts/002-DevOps-Workspace.md`.

## Convenciones de código

Definidas en [`docs/prompts/03-CODING-STANDARDS.md`](prompts/03-CODING-STANDARDS.md) y aplicadas mediante ESLint + TypeScript estricto:

- TypeScript strict en todo el workspace; `any` prohibido salvo justificación explícita.
- Imports de tipos con `import type`.
- Sin acceso directo a `process.env`: toda variable de entorno se valida en el módulo `config` de cada app usando `@mijersey/config`.
- Cada paquete/app mantiene su propio `.eslintrc` extendiendo la configuración raíz (`.eslintrc.cjs`).

## Añadir un paquete o app nueva

1. Crear la carpeta bajo `apps/` o `packages/`.
2. Agregar `package.json` con el nombre `@mijersey/<nombre>` y los scripts estándar: `dev`, `build`, `lint`, `typecheck`, `test`, `clean`.
3. Extender `tsconfig.base.json` desde la raíz.
4. Declarar dependencias internas con `workspace:*`.
5. `pnpm install` desde la raíz para enlazar el workspace.

## Trabajar con Prisma

```bash
pnpm --filter @mijersey/api prisma:generate   # regenerar el cliente tipado
pnpm --filter @mijersey/api prisma:migrate    # crear/aplicar una migración en desarrollo
pnpm --filter @mijersey/api prisma:seed       # ejecutar el seed
```

El schema vive en `apps/api/prisma/schema.prisma`. Este sprint (001) no define entidades de negocio; los módulos de dominio (003 en adelante) las incorporan progresivamente. El schema incluye un modelo técnico `SchemaPlaceholder` (Prisma exige al menos un modelo para generar el cliente); elimínalo en cuanto agregues el primer modelo de dominio real.

## Estructura de un módulo NestJS

Cada dominio en `apps/api/src/<dominio>` sigue las capas definidas en `docs/prompts/04-ARCHITECTURE.md`: Controller → Use Case → Repository → Infrastructure. El dominio nunca depende de infraestructura.

## Actualizar dependencias

```bash
pnpm outdated -r                      # ver qué está desactualizado en todo el workspace
pnpm update --interactive --recursive # actualizar de forma controlada
```

Antes de subir una versión mayor de una dependencia, evalúa lo que pide `03-CODING-STANDARDS.md` §13: mantenimiento, comunidad, licenciamiento, tamaño, seguridad y compatibilidad. Tras actualizar, corre `pnpm install && pnpm build && pnpm lint && pnpm typecheck && pnpm test` antes de hacer commit.

## Resolución de problemas frecuentes

| Problema                                            | Causa habitual                                      | Solución                                                                                                    |
| --------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `Environment validation failed` al iniciar una app  | Falta una variable requerida en `.env`              | Revisa [environment-variables.md](environment-variables.md) y compara con el `.env.example` correspondiente |
| La API no conecta a PostgreSQL/Redis                | Los contenedores `postgres`/`redis` no están arriba | `docker compose up postgres redis -d`                                                                       |
| Cambios en un `package/*` no se reflejan en una app | El paquete no se reconstruyó                        | Corre `pnpm dev` desde la raíz (ejecuta el watch de todos los paquetes) o `pnpm --filter <paquete> build`   |
| El commit se rechaza con un error de `commitlint`   | El mensaje no sigue Conventional Commits            | Usa el formato `tipo(alcance opcional): descripción` — ver [git-workflow.md](git-workflow.md)               |
| El pre-commit tarda o falla en `pnpm typecheck`     | Hay un error de tipos en el workspace               | Corre `pnpm typecheck` manualmente para ver el detalle antes de reintentar el commit                        |
