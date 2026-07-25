# Guía de contribución

## Antes de empezar

1. Revisa `docs/prompts/00-CONSTITUTION.md` y `docs/prompts/03-CODING-STANDARDS.md` — son de cumplimiento obligatorio.
2. Sigue el flujo de ramas y commits descrito en [git-workflow.md](git-workflow.md).
3. Instala el entorno según [installation.md](installation.md).

## Checklist antes de un Pull Request

- [ ] El código compila (`pnpm build`).
- [ ] Lint sin errores (`pnpm lint`).
- [ ] Tipos sin errores (`pnpm typecheck`).
- [ ] Pruebas relevantes agregadas y en verde (`pnpm test`).
- [ ] No hay `console.log`, código muerto, ni valores mágicos.
- [ ] No se accede a `process.env` fuera del módulo de configuración de la app.
- [ ] La documentación se actualizó si el cambio lo amerita.
- [ ] El commit sigue Conventional Commits.

## Revisión de código

Todo cambio debe poder responder que sí a (`03-CODING-STANDARDS.md` §18):

- ¿Es más claro?
- ¿Es más seguro?
- ¿Es más mantenible?
- ¿Respeta la arquitectura definida en `04-ARCHITECTURE.md`?
- ¿Evita duplicación?
- ¿Tiene pruebas cuando corresponde?

Si alguna respuesta es negativa, se revisa antes de integrar.

## Alcance de los cambios

Cada especificación (`docs/prompts/0XX-*.md`) define su propio alcance y lo que explícitamente excluye. Un PR no debe adelantar trabajo de un módulo futuro ni dejar deuda técnica deliberada — ver `00-CONSTITUTION.md` §4 y §21.
