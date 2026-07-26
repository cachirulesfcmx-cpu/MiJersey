# Autenticación y autorización

Implementación de [`docs/prompts/003-Authentication-Authorization.md`](prompts/003-Authentication-Authorization.md). El dominio vive en `apps/api/src/modules/identity` siguiendo las capas de `04-ARCHITECTURE.md` (domain → application → infrastructure → presentation).

## Modelo de tokens

- **Access token**: JWT firmado (`JWT_ACCESS_SECRET`), vida corta (15 min), viaja en el body de la respuesta y se envía como `Authorization: Bearer <token>`. Contiene `sub` (userId), `role` y `sid` (id de sesión).
- **Refresh token**: valor opaco aleatorio (32 bytes), **no** es un JWT. Se entrega como cookie `httpOnly`, `Secure` en producción, `SameSite=Lax`, vida de 30 días. Solo se almacena su hash SHA-256 en la tabla `sessions`; el valor en texto plano nunca se persiste.
- **Rotación**: cada `POST /auth/refresh` invalida el refresh token usado y emite uno nuevo (`SessionRepositoryPort.rotate`), reduciendo la ventana de reúso si un token se filtra.
- **Revocación**: `POST /auth/logout` revoca la sesión actual; `DELETE /sessions` revoca todas las demás. El access token emitido antes de una revocación sigue siendo válido hasta su expiración (máx. 15 min) — es el trade-off estándar de usar JWT sin lista de revocación.

## Por qué cookie + header en vez de todo en cookie

El storefront/admin (Next.js) y la API (NestJS) corren en orígenes distintos. La cookie de refresh solo puede leerse en el dominio de la API; el access token se guarda en memoria del cliente (contexto de React) y se reenvía explícitamente. Esto evita almacenar tokens de larga vida en `localStorage` (superficie de ataque XSS) sin depender de que ambos frontends compartan dominio con la API.

## RBAC

Roles fijos (`docs/prompts/003-Authentication-Authorization.md` §5): `SUPER_ADMIN`, `ADMIN`, `EDITOR`, `SUPPORT`, `CUSTOMER`. Los permisos son datos (tabla `permissions` + `role_permissions`), no lógica dispersa: `PermissionsGuard` + `@RequirePermission('clave')` consultan `PermissionRepositoryPort` en cada request. Agregar un permiso nuevo (para un módulo futuro) no requiere tocar el guard, solo el seed.

Permisos sembrados en este sprint (`apps/api/prisma/seed.ts`) son deliberadamente mínimos: `admin:access`, `identity:manage`, `system:configure`. Los módulos de dominio (005+) agregan los suyos.

## Protección contra ataques comunes

| Riesgo                                                | Mitigación                                                                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Enumeración de usuarios en login                      | `LoginUseCase` compara siempre contra un hash (real o señuelo) antes de responder                                      |
| Enumeración vía forgot-password / resend-verification | Ambos devuelven `204` sin importar si el correo existe                                                                 |
| Fuerza bruta                                          | `@nestjs/throttler` limita `login`, `register`, `forgot-password`, `reset-password`, `resend-verification`             |
| Contraseñas en texto plano                            | `bcryptjs`, 12 rondas                                                                                                  |
| Fuga de tokens en logs                                | `pino-http` redacta `authorization`, `cookie`, `set-cookie` (ver [environment-variables.md](environment-variables.md)) |
| Sesión robada tras cambio de contraseña               | `ResetPasswordUseCase` revoca todas las sesiones del usuario                                                           |

## Por qué bcryptjs y no bcrypt

`bcrypt` requiere compilar un binding nativo (node-gyp) tanto en macOS como en la imagen `node:20-alpine` del Dockerfile. `bcryptjs` es una implementación pura en JS, sin pasos de build adicionales en ningún entorno (local, CI, Docker, Railway), a costa de ser algo más lento — aceptable para el volumen de auth de esta plataforma.

## Endpoints

| Método | Ruta                        | Público              | Descripción                                      |
| ------ | --------------------------- | -------------------- | ------------------------------------------------ |
| POST   | `/auth/register`            | Sí                   | Registro de clientes                             |
| POST   | `/auth/login`               | Sí                   | Inicia sesión, setea cookie de refresh           |
| POST   | `/auth/refresh`             | Sí (requiere cookie) | Rota la sesión, emite nuevo access token         |
| POST   | `/auth/logout`              | No                   | Revoca la sesión actual                          |
| POST   | `/auth/forgot-password`     | Sí                   | Envía enlace de recuperación si el correo existe |
| POST   | `/auth/reset-password`      | Sí                   | Cambia la contraseña con un token válido         |
| POST   | `/auth/verify-email`        | Sí                   | Confirma el correo con un token válido           |
| POST   | `/auth/resend-verification` | Sí                   | Reenvía el enlace de verificación                |
| GET    | `/auth/me`                  | No                   | Perfil del usuario autenticado                   |
| GET    | `/sessions`                 | No                   | Lista las sesiones activas del usuario           |
| DELETE | `/sessions/:id`             | No                   | Revoca una sesión específica                     |
| DELETE | `/sessions`                 | No                   | Revoca todas las sesiones salvo la actual        |

Todas las respuestas de error siguen el contrato `ApiErrorResponse` (`@mijersey/shared-types`), incluido `requestId` para correlación con los logs.

## Correo (temporal)

`ConsoleMailer` registra el enlace de verificación/recuperación en el log estructurado en vez de enviarlo. Es un adaptador de `MailerPort`; el proveedor real (SMTP/ESP) llega con `031-Email-Templates` sin tocar el dominio.

## Migración

`apps/api/prisma/migrations/20260726054245_init_identity` se generó y aplicó
contra el servicio Postgres de Railway (proyecto `MiJersey`), ya que este
entorno de desarrollo no tiene Docker instalado. El seed (`pnpm prisma:seed`)
corrió contra la misma base: los 5 roles y los permisos mínimos ya existen.

Para desarrollo local con Docker, `pnpm prisma:migrate` aplicará esta misma
migración contra el Postgres del `docker-compose.yml`.
