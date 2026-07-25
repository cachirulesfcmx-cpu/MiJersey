# 001 -- Foundation & Bootstrap

## Engineering Specification

Version: 1.0

> Este documento define el primer sprint del proyecto. Su propósito es
> construir una base técnica estable sobre la cual se desarrollarán
> todos los módulos posteriores. No implementa funcionalidades de
> negocio.

------------------------------------------------------------------------

# 1. Objetivo

Crear un monorepo completamente funcional, reproducible y listo para
producción, con todas las herramientas, configuraciones y estándares
necesarios para comenzar el desarrollo del sistema.

Al finalizar este sprint, cualquier desarrollador deberá poder clonar el
repositorio y ejecutar la plataforma completa siguiendo únicamente la
documentación.

------------------------------------------------------------------------

# 2. Alcance

Incluye:

-   Inicialización del monorepo.
-   Configuración del workspace.
-   Frontend público.
-   Panel administrativo.
-   Backend API.
-   Paquetes compartidos.
-   Base de datos.
-   Redis.
-   Docker.
-   Configuración centralizada.
-   Calidad de código.
-   Documentación inicial.

No incluye:

-   Productos.
-   Usuarios.
-   CMS.
-   Inventario.
-   Pedidos.
-   Checkout.
-   Pagos.
-   Marketing.

------------------------------------------------------------------------

# 3. Tecnologías

## Frontend

-   Next.js (App Router)
-   React
-   TypeScript (Strict)
-   Tailwind CSS

## Backend

-   NestJS
-   Prisma ORM
-   PostgreSQL
-   Redis

## Monorepo

-   pnpm Workspaces
-   Turborepo

## Calidad

-   ESLint
-   Prettier
-   Husky
-   lint-staged

## Infraestructura

-   Docker
-   Docker Compose
-   Nginx

------------------------------------------------------------------------

# 4. Estructura esperada

    apps/
      web/
      admin/
      api/

    packages/
      ui/
      design-tokens/
      config/
      sdk/
      shared-types/
      shared-utils/

    infra/
      docker/
      nginx/
      scripts/

    docs/

Cada carpeta deberá tener una única responsabilidad.

------------------------------------------------------------------------

# 5. Configuración

Implementar:

-   variables de entorno por aplicación;
-   validación mediante Zod;
-   configuración tipada;
-   separación dev / test / production;
-   configuración centralizada.

Ningún módulo accederá directamente a `process.env`.

------------------------------------------------------------------------

# 6. Base de datos

Preparar:

-   Prisma.
-   Migraciones.
-   Seeds.
-   Cliente tipado.
-   Scripts para desarrollo.

No crear entidades de negocio.

------------------------------------------------------------------------

# 7. Redis

Configurar una instancia preparada para:

-   cache;
-   colas futuras;
-   sesiones si fueran necesarias.

No implementar lógica de negocio.

------------------------------------------------------------------------

# 8. Docker

El proyecto deberá iniciarse con un único comando.

Servicios mínimos:

-   web
-   admin
-   api
-   postgres
-   redis
-   nginx

Todos los servicios deberán compartir una red interna.

------------------------------------------------------------------------

# 9. Calidad

Configurar automáticamente:

-   TypeScript Strict.
-   ESLint.
-   Prettier.
-   Husky.
-   lint-staged.

Todo commit deberá validar el código antes de aceptarse.

------------------------------------------------------------------------

# 10. Scripts

Como mínimo:

-   dev
-   build
-   start
-   lint
-   test
-   format
-   prisma:migrate
-   prisma:seed

Los nombres deberán ser consistentes en todas las aplicaciones.

------------------------------------------------------------------------

# 11. Documentación

Generar:

-   README principal.
-   Guía de instalación.
-   Guía de desarrollo.
-   Arquitectura del repositorio.
-   Variables de entorno.
-   Comandos disponibles.

------------------------------------------------------------------------

# 12. Entregables

Claude Code deberá generar:

-   estructura completa del proyecto;
-   archivos de configuración;
-   Docker Compose;
-   configuración de Turborepo;
-   configuración de pnpm;
-   configuración de Next.js;
-   configuración de NestJS;
-   configuración de Prisma;
-   configuración de Tailwind;
-   configuración de ESLint y Prettier;
-   documentación.

No utilizar código de ejemplo ni archivos vacíos.

------------------------------------------------------------------------

# 13. Criterios de aceptación

Se considera completado cuando:

-   todas las aplicaciones compilan;
-   Docker Compose inicia correctamente;
-   PostgreSQL responde;
-   Redis responde;
-   Prisma conecta;
-   el frontend inicia;
-   el panel administrativo inicia;
-   la API inicia;
-   el workspace ejecuta lint sin errores.

------------------------------------------------------------------------

# 14. Restricciones

-   No implementar funcionalidades de negocio.
-   No crear entidades de dominio.
-   No introducir dependencias innecesarias.
-   No romper las reglas de los documentos 00--04.

------------------------------------------------------------------------

# 15. Definition of Done

Antes de finalizar, verificar que:

-   la estructura es consistente;
-   el proyecto puede ejecutarse desde cero;
-   toda configuración está documentada;
-   el sprint deja preparada la plataforma para comenzar el documento
    **002 -- DevOps Workspace** sin reorganizaciones ni cambios
    estructurales.
