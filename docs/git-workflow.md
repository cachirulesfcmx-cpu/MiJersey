# Flujo de Git

## Ramas

| Rama                | Propósito                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| `main`              | Código listo para producción. Siempre estable.                                                        |
| `develop`           | Integración de features en curso.                                                                     |
| `feature/<nombre>`  | Una funcionalidad o módulo (ej. `feature/003-authentication`). Sale de `develop`, vuelve a `develop`. |
| `hotfix/<nombre>`   | Corrección urgente sobre `main`. Sale de `main`, vuelve a `main` y a `develop`.                       |
| `release/<version>` | Estabilización previa a publicar. Sale de `develop`, vuelve a `main` y a `develop`.                   |

Todo cambio se integra mediante Pull Request — nunca commits directos a `main` o `develop`.

## Conventional Commits

Cada commit debe seguir el formato `<tipo>(<alcance opcional>): <descripción>`, validado automáticamente por `commitlint` en el hook `commit-msg`.

Tipos permitidos:

| Tipo       | Uso                                         |
| ---------- | ------------------------------------------- |
| `feat`     | Nueva funcionalidad                         |
| `fix`      | Corrección de un bug                        |
| `refactor` | Cambio de código sin alterar comportamiento |
| `docs`     | Solo documentación                          |
| `style`    | Formato, sin cambios de lógica              |
| `test`     | Añadir o corregir pruebas                   |
| `chore`    | Mantenimiento (dependencias, configuración) |
| `perf`     | Mejora de rendimiento                       |
| `build`    | Sistema de build o dependencias externas    |
| `ci`       | Configuración de integración continua       |

Ejemplos:

```
feat(catalog): agregar filtro por categoría
fix(api): corregir validación de email en registro
docs: actualizar guía de instalación
```

## Pull Requests

Antes de abrir un PR, verifica localmente (el hook `pre-commit` ya corre lint + typecheck en cada commit):

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

Un PR se puede fusionar cuando:

- CI (`.github/workflows/ci.yml`) pasa en verde.
- Respeta `docs/prompts/03-CODING-STANDARDS.md` §18 (Revisión de Código): más claro, más seguro, más mantenible, respeta la arquitectura, evita duplicación, tiene pruebas cuando corresponde.
- No introduce funcionalidades fuera del alcance del módulo/documento correspondiente.
