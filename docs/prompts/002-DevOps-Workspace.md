# 002 -- DevOps Workspace

## Engineering Specification

Version: 1.0

> Este documento define la preparación del entorno de desarrollo,
> automatización y flujo de trabajo del proyecto. Su objetivo es
> garantizar que todos los desarrolladores trabajen bajo las mismas
> reglas y que el ciclo de desarrollo sea reproducible y confiable.

------------------------------------------------------------------------

# 1. Objetivo

Construir un entorno DevOps completo para desarrollo local, integración
continua y despliegues futuros, minimizando errores manuales y
asegurando consistencia entre ambientes.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Estandarización del entorno de desarrollo.
-   Automatización de tareas.
-   Configuración de CI.
-   Gestión de secretos.
-   Estrategia de ramas.
-   Convenciones de commits.
-   Scripts de mantenimiento.
-   Validaciones automáticas.

No incluye:

-   Infraestructura cloud.
-   Despliegue en producción.
-   Monitoreo avanzado.
-   Funcionalidades de negocio.

------------------------------------------------------------------------

# 3. Entorno de Desarrollo

Definir como estándar:

-   Node.js LTS.
-   pnpm.
-   Docker Desktop.
-   Git.
-   Visual Studio Code (configuración recomendada).

Proporcionar archivo de configuración para el editor con extensiones y
formato recomendado.

------------------------------------------------------------------------

# 4. Git Workflow

Modelo recomendado:

-   main
-   develop
-   feature/\*
-   hotfix/\*
-   release/\*

Todo cambio deberá realizarse mediante Pull Request.

------------------------------------------------------------------------

# 5. Convenciones de Commits

Adoptar Conventional Commits.

Tipos mínimos:

-   feat
-   fix
-   refactor
-   docs
-   style
-   test
-   chore
-   perf
-   build
-   ci

------------------------------------------------------------------------

# 6. Automatización

Configurar scripts para:

-   instalación
-   desarrollo
-   compilación
-   pruebas
-   lint
-   formateo
-   limpieza de caché
-   regeneración de Prisma

Todos los comandos deberán funcionar desde la raíz del monorepo.

------------------------------------------------------------------------

# 7. Hooks

Configurar Husky y lint-staged.

Antes de cada commit ejecutar:

-   ESLint
-   Prettier
-   Type Checking

Impedir commits con errores.

------------------------------------------------------------------------

# 8. Integración Continua

Preparar un workflow de CI que ejecute:

1.  Instalación de dependencias.
2.  Restauración de caché.
3.  Lint.
4.  Type Check.
5.  Build.
6.  Pruebas.
7.  Verificación de artefactos.

El pipeline deberá finalizar con error si falla cualquiera de los pasos.

------------------------------------------------------------------------

# 9. Variables de Entorno

Separar:

-   development
-   test
-   production

Utilizar plantillas `.env.example`.

Validar todas las variables mediante el sistema de configuración
central.

Nunca almacenar secretos en el repositorio.

------------------------------------------------------------------------

# 10. Docker

Mantener un entorno de desarrollo reproducible.

El workspace deberá iniciarse mediante un único comando y reconstruirse
completamente sin intervención manual.

------------------------------------------------------------------------

# 11. Calidad

Automatizar:

-   formato consistente
-   imports ordenados
-   eliminación de código muerto cuando sea posible
-   verificación de tipos

------------------------------------------------------------------------

# 12. Documentación

Generar:

-   guía de instalación
-   guía de actualización
-   guía de contribución
-   flujo Git
-   resolución de problemas frecuentes
-   comandos disponibles

------------------------------------------------------------------------

# 13. Entregables

Claude Code deberá generar:

-   configuración de GitHub Actions (o equivalente)
-   Husky
-   lint-staged
-   archivos de configuración del editor
-   scripts del workspace
-   documentación DevOps

------------------------------------------------------------------------

# 14. Criterios de Aceptación

El documento se considera implementado cuando:

-   un desarrollador nuevo puede preparar el entorno únicamente
    siguiendo la documentación;
-   todos los scripts funcionan desde la raíz;
-   los hooks bloquean código inválido;
-   la integración continua valida automáticamente el proyecto.

------------------------------------------------------------------------

# 15. Definition of Done

Antes de finalizar verificar que:

-   el flujo de desarrollo es reproducible;
-   la automatización reduce tareas manuales;
-   el proyecto está preparado para iniciar el documento **003 --
    Authentication & Authorization** sin cambios adicionales en el
    entorno.
