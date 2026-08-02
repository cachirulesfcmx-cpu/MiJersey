# Production Hardening

Implementación de [`docs/prompts/035-Production-Hardening.md`](prompts/035-Production-Hardening.md). A diferencia de los 34 módulos anteriores, este no introduce un dominio de negocio nuevo — es un spec de endurecimiento operativo (seguridad, observabilidad, continuidad, CI/CD, rendimiento) sobre la plataforma ya construida. Es también el décimo módulo implementado en esta sesión y el último de la lista de specs disponible; no hay un 036.

## Alcance real: qué ya existía, qué se agregó

Antes de escribir una sola línea de código se auditó el estado actual del proyecto, porque buena parte del spec (§3 Seguridad, §4 Observabilidad) ya estaba resuelta incidentalmente por decisiones tomadas en módulos anteriores. Documentar esto explícitamente evita la lectura equivocada de que 035 "empezó de cero":

**Ya presente antes de 035** (verificado, no reimplementado):

- **Headers de seguridad y CSP**: `helmet()` en `main.ts` desde el módulo 001, con `crossOriginResourcePolicy: 'cross-origin'` (necesario para que admin/web carguen imágenes de la Media Library entre orígenes).
- **HSTS, X-Frame-Options, X-Content-Type-Options**: incluidos por defecto en `helmet()`.
- **Rate limiting**: `@nestjs/throttler` con límite global de 100 req/min por IP (`identity.module.ts`) y límites específicos más estrictos en endpoints sensibles (`/auth/login` 10/min, `/auth/mfa/verify` 5/min, `/auth/reset-password` 5/min, etc.).
- **Logging estructurado**: `nestjs-pino` con redacción explícita de `authorization`, `cookie`, `x-api-key` y `set-cookie` (comentario en `app.module.ts` que cita el estándar de codificación del proyecto), y `x-request-id` correlacionado en cada log/respuesta.
- **Cookies de sesión**: `httpOnly`, `secure` en producción, `sameSite: 'lax'` — esto ya mitiga la mayoría de vectores CSRF sobre el endpoint `/auth/refresh` sin necesidad de un token CSRF adicional, porque un navegador no adjunta cookies `SameSite=Lax` en requests cross-site que no sean navegación de nivel superior.
- **Comparación de contraseña a tiempo constante contra el usuario**: `LoginUseCase` siempre compara contra un hash (real o señuelo) para no filtrar por timing si un correo existe.
- **Auditoría de accesos**: `auth.login.success`/`auth.login.failed` ya se registraban desde el módulo 003; **035 solo añade** los eventos de MFA (`auth.mfa.enabled`, `.disabled`, `.challenge_failed`) al mismo `AuditLogRepositoryPort`.
- **Health check combinado** (`GET /health`, Postgres + Redis vía `@nestjs/terminus`) desde el módulo 001.
- **CI con lint/typecheck/build/test** (`.github/workflows/ci.yml`) desde el módulo 002.

**Agregado en 035** (la brecha real entre el spec y lo anterior):

1. MFA (TOTP) para personal interno — el ítem de seguridad explícitamente ausente.
2. Separación de liveness/readiness (`/health/live`, `/health/ready`) — el spec pide ambos probes distintos; antes solo existía uno combinado.
3. Métricas Prometheus (`/metrics`) — no existía ningún endpoint de métricas.
4. Scripts de backup/restore de Postgres y un script de prueba de carga real.
5. Endurecimiento de CI (auditoría de dependencias, CodeQL) y de la configuración de Nginx (rate limiting de borde, restricción de `/metrics`, `server_tokens off`).

## MFA (TOTP) para personal interno

### Por qué solo administradores, no clientes

El spec (§3) pide "MFA para administradores", no para toda la base de usuarios. `UserEntity.canUseMfa()` devuelve `false` para `RoleName.CUSTOMER` — un cliente jamás inicia sesión en `apps/admin`, y forzar un segundo factor sobre el storefront público habría sido fricción no pedida. `EnrollMfaUseCase` rechaza con `403 MFA_NOT_APPLICABLE` si se invoca desde una cuenta de cliente (verificado en vivo).

### Opt-in, no obligatorio por rol

MFA es una función que cada cuenta de staff activa voluntariamente desde `/profile`, no un candado forzado en el primer login. El spec no exige "todo admin debe tener 2FA activo antes de poder operar"; imponerlo habría requerido inventar un flujo de onboarding forzado no pedido por el spec. Forzarlo vía política (ej. bloquear login de `SUPER_ADMIN` sin MFA activo) queda en "Alcance diferido" como una decisión de política, no técnica.

### Secreto cifrado en reposo, nunca en claro

El spec (§3 "cifrado de datos sensibles") se toma literalmente para el secreto TOTP: `AesGcmMfaSecretCipher` cifra con AES-256-GCM antes de tocar `User.mfaSecret`, con una clave derivada por SHA-256 de `MFA_ENCRYPTION_KEY` (así cualquier string sirve de clave sin exigir base64 exacto de 32 bytes). El formato persistido es `iv:authTag:cipherText`, cada segmento en base64. Sin esto, comprometer un dump de la base de datos bastaría para clonar el segundo factor de cualquier cuenta.

### Enrolamiento en dos pasos: generar y confirmar

`EnrollMfaUseCase` genera un secreto TOTP nuevo y lo persiste con `mfaEnabled: false` ("pendiente de confirmar") — reenrollar antes de confirmar simplemente reemplaza el secreto anterior sin dejar estado huérfano. `ConfirmMfaUseCase` exige un código válido generado con ese secreto antes de poner `mfaEnabled: true`; esto evita que un usuario quede con MFA "activado" sin haber probado que su aplicación autenticadora (Google Authenticator, Authy, 1Password…) realmente puede generar códigos correctos.

### Login de dos pasos vía Redis, no un JWT de propósito especial

Cuando `LoginUseCase` detecta `user.mfaEnabled`, no emite tokens de sesión: crea un desafío opaco de un solo uso (`MfaChallengeStorePort`, Redis con TTL de 5 minutos) y responde `{ mfaRequired: true, challengeToken }`. Se descartó deliberadamente resolver esto con un JWT de "challenge" de corta duración firmado con el mismo secreto de acceso: `JwtAuthGuard.verifyAccessToken()` no distingue el _propósito_ de un token, solo su firma — un JWT de desafío filtrado o mal manejado habría podido colarse como si fuera un access token válido en cualquier endpoint protegido durante su ventana de vida. Un token opaco almacenado server-side en Redis no tiene ese riesgo: no es un JWT, no pasa el guard global, y solo `VerifyMfaChallengeUseCase` sabe interpretarlo.

### Bug real encontrado en la propia verificación en vivo: el desafío no debe invalidarse en un intento fallido

La primera implementación de `RedisMfaChallengeStore.consume()` usaba `GETDEL` (lectura + borrado atómico) sin condicionarlo al resultado de la verificación del código. Al probar en vivo el flujo completo (login → código incorrecto → reintento con el código correcto) se confirmó el bug: el segundo intento devolvía `401 MFA_CHALLENGE_INVALID` aunque el `challengeToken` seguía dentro de su ventana de 5 minutos, porque el primer intento fallido ya lo había borrado. Se corrigió separando el puerto en `peek()` (lectura sin borrar) e `invalidate()` (borrado explícito, invocado solo tras una verificación exitosa) — un típeo en el código no debe forzar a repetir el login completo con contraseña. Se agregó una prueba unitaria que fija este comportamiento (`does not invalidate the challenge on an incorrect code`).

### Auditoría

`auth.mfa.enabled`, `auth.mfa.disabled`, `auth.mfa.challenge_failed`. Un login exitoso vía MFA se sigue registrando como `auth.login.success` (mismo action name que un login normal, con `metadata: { mfa: true }`) para que cualquier dashboard que ya cuente logins por esa acción no necesite cambiar su query.

## Observabilidad: liveness/readiness separados y métricas Prometheus

### `/health/live` no valida dependencias; `/health/ready` sí

El spec (§4) pide "Readiness y Liveness probes" como conceptos distintos, y la distinción importa en la práctica: un liveness probe que verifica Postgres/Redis haría que un orquestador (Kubernetes, o el healthcheck de Railway) reinicie el contenedor de la API cada vez que la base de datos tenga una caída transitoria — exactamente lo contrario de lo que se quiere durante un incidente de infraestructura. `GET /health/live` solo confirma que el proceso Node responde (`{ status: 'ok' }`); `GET /health/ready` sí corre los mismos checks de Postgres/Redis que el `GET /health` combinado (que se conserva por compatibilidad con cualquier monitoreo ya apuntando ahí).

### Métricas Prometheus con `prom-client`

`MetricsService` expone métricas de proceso por defecto (`collectDefaultMetrics`: CPU, memoria, event loop lag, handles activos) más un histograma (`http_request_duration_seconds`) y un contador (`http_requests_total`) de requests HTTP, alimentados por `HttpMetricsMiddleware` — un middleware global registrado una sola vez en `AppModule.configure()`. La etiqueta `route` usa el **patrón** de la ruta (`req.baseUrl + req.route.path`, ej. `/admin/products/:id`), no la URL cruda: usar la URL real habría creado una serie de tiempo nueva por cada id de recurso, con cardinalidad sin límite.

`GET /metrics` no exige autenticación (igual que `/health`) porque un scraper de Prometheus real no manda bearer tokens; la responsabilidad de restringir el acceso se delega a la capa de red (ver Nginx más abajo), documentado explícitamente en el propio controller.

### Bug real encontrado en la prueba de carga: `/health`/`/metrics` estaban sujetos al rate limit global

Al correr la prueba de carga real (`autocannon`, 50 conexiones, 10s) contra `GET /health/live`, el resultado inicial fue **100 respuestas `2xx` de 224,000 requests totales** — el resto, `429 Too Many Requests`. La causa: el límite global de `@nestjs/throttler` (100 req/min por IP) se aplicaba también a las rutas de salud/métricas, así que cualquier orquestador que sondee salud cada pocos segundos, o cualquier scraper de Prometheus, agotaría la cuota compartida con el tráfico real y empezaría a recibir `429` en su propio probe — lo que llevaría a un orquestador real a reiniciar el contenedor sin ninguna razón operativa válida. Se corrigió con `@SkipThrottle()` a nivel de `HealthController` y `MetricsController`. Repetida la misma prueba tras el fix: **~25,000 req/s sostenidas, sin ningún `429`** (ver sección de verificación).

## Backups y recuperación

### Scripts reales, no solo documentación

`infra/scripts/backup-db.sh` (`pg_dump --format=custom`) y `infra/scripts/restore-db.sh` (`pg_restore --clean --if-exists`), siguiendo el mismo estilo (`set -euo pipefail`, comentario de cabecera) que el `docker-reset.sh` ya existente en el proyecto.

### Hallazgo real al ejecutar el backup contra Railway: incompatibilidad de versión de `pg_dump`

El primer intento de correr `backup-db.sh` contra la base real falló con `server version: 18.4 ... pg_dump version: 14.18 ... aborting because of server version mismatch` — Railway sirve Postgres 18, pero Homebrew instala `postgresql@14` por defecto en macOS, y `pg_dump` no soporta volcar desde un servidor _más nuevo_ que el propio cliente. Se instaló `postgresql@18` vía Homebrew y se corrió el backup real: **dump válido de 234 KB, 553 entradas en el TOC**, verificado con `pg_restore --list`. Este hallazgo se documentó directamente como comentario dentro de `backup-db.sh` — es exactamente el tipo de sorpresa operativa que un runbook de producción real debe anticipar, y por eso el propio script advierte sobre la necesidad de igualar la versión del cliente a la del servidor (o correr el backup dentro de un contenedor con la versión correcta).

### RPO/RTO objetivo (documentado, no automatizado)

Sin un cron de backups en este entorno (no hay infraestructura de scheduling fuera de Vercel/Railway), el objetivo documentado es:

- **RPO (Recovery Point Objective)**: 24 horas — un backup diario vía `backup-db.sh` ejecutado por un cron externo (GitHub Actions programado, o el scheduler nativo de Railway) sería suficiente para el volumen de datos actual.
- **RTO (Recovery Time Objective)**: menor a 1 hora — `restore-db.sh` contra una base Postgres nueva de tamaño equivalente debería completarse en minutos; el resto del tiempo lo consume el despliegue de la propia API apuntando a la base restaurada.

Automatizar el cron y probar una restauración completa end-to-end contra un proyecto Railway aislado queda en "Alcance diferido" — requeriría aprovisionar infraestructura adicional (un segundo proyecto Railway, credenciales de backup separadas) fuera del alcance de esta sesión.

## Prueba de carga real

`infra/scripts/load-test.sh` envuelve `autocannon` (vía `npx`, sin instalación previa) parametrizado por URL/duración/conexiones. Corrida real contra la API local (`GET /health/live`, 50 conexiones, 10s) tras el fix de `@SkipThrottle()`:

| Métrica              | Resultado                |
| -------------------- | ------------------------ |
| Requests totales     | ~275,000 en 11.01s       |
| Throughput           | ~25,000 req/s sostenidas |
| Latencia p50 / p97.5 | 1 ms / 3 ms              |
| Latencia máxima      | 130 ms                   |
| Respuestas no-2xx    | 0                        |

No se corrió una prueba de carga contra endpoints con escritura a Postgres (ej. checkout) porque habría generado datos de prueba masivos en la base compartida de Railway sin un ambiente de staging aislado para ello — ver "Alcance diferido".

## CI/CD

- **Auditoría de dependencias no bloqueante** (`pnpm audit --audit-level=high`, `continue-on-error: true`) agregada a `ci.yml`. Se decidió no bloquear el pipeline: al momento de agregar este paso, `pnpm audit` ya reporta **51 vulnerabilidades (1 crítica, 21 altas)** heredadas de dependencias transitorias del toolchain de ESLint, y **34 vulnerabilidades (14 altas)** en dependencias de producción — principalmente Next.js 14.2.35 y PostCSS. Bloquear el CI hoy lo habría dejado permanentemente en rojo sin una campaña de actualización de dependencias mayor (upgrade de Next.js, de ESLint) que está fuera del alcance de este cambio. El paso existe para que estas vulnerabilidades sean **visibles** en cada corrida en vez de invisibles — la alternativa real habría sido no auditar en absoluto.
- **CodeQL** (`.github/workflows/codeql.yml`), análisis estático nativo de GitHub para JavaScript/TypeScript, en cada push/PR más una corrida semanal programada (para detectar advisories nuevos sobre código que no cambió).
- El pipeline de `build`/`test`/`lint`/`typecheck` ya existente (002) no se modificó estructuralmente.

### Rollback

No existe un pipeline de despliegue continuo propio en este repositorio (el despliegue real ocurre en Vercel/Railway, plataformas con su propio mecanismo de rollback por despliegue anterior — ninguna de las dos requiere un workflow adicional en este repo para revertir). Documentado como tal en el checklist de producción, en vez de fabricar un job de "deploy" que no correspondería a ninguna infraestructura real de este proyecto.

## Nginx (borde)

`infra/nginx/nginx.conf` (usado por `docker-compose.yml`, monta este archivo dentro de la imagen oficial `nginx:1.27-alpine`) se amplió con:

- `server_tokens off` — no anunciar la versión de Nginx en headers/páginas de error.
- `client_max_body_size 10m` — límite de tamaño de payload a nivel de borde, antes de llegar a Node.
- `limit_req_zone`/`limit_req` — rate limiting independiente y adicional al de `@nestjs/throttler`, pensado para absorber tráfico abusivo antes de abrir una conexión hacia el proceso Node.
- `location /api/metrics` restringido a rangos de IP privados (loopback, RFC1918) — Prometheus/métricas nunca debe quedar expuesto a Internet.
- `gzip on` para las respuestas de texto/JSON/JS.

Verificado con `nginx -t` (sintaxis válida; el único error reportado es la resolución DNS de los hostnames de Docker Compose — `web`/`api` — esperable al validar fuera del contexto del compose network).

## Endpoints nuevos

| Método | Ruta                | Auth                | Descripción                                               |
| ------ | ------------------- | ------------------- | --------------------------------------------------------- |
| GET    | `/health/live`      | Público, sin límite | Liveness — el proceso responde                            |
| GET    | `/health/ready`     | Público, sin límite | Readiness — Postgres + Redis accesibles                   |
| GET    | `/metrics`          | Público, sin límite | Métricas Prometheus (proceso + HTTP)                      |
| POST   | `/auth/mfa/verify`  | Público (challenge) | Completa el login cuando el usuario tiene MFA activo      |
| POST   | `/auth/mfa/enroll`  | Sesión (self)       | Genera un secreto TOTP pendiente de confirmar             |
| POST   | `/auth/mfa/confirm` | Sesión (self)       | Confirma el enrolamiento con un código válido, activa MFA |
| POST   | `/auth/mfa/disable` | Sesión (self)       | Desactiva MFA, exige un código vigente                    |

## SDK

- `packages/sdk/src/auth.types.ts`: `mfaEnabled` en `UserProfile`; `LoginResult` como unión discriminada `AuthSession | MfaChallenge` (`mfaRequired: false | true`); `EnrollMfaResult`, `MfaCodeInput`, `VerifyMfaChallengeInput`.
- `api-client.ts`: `login()` ahora devuelve `LoginResult` (rompe el contrato anterior de `AuthSession` directo — ambas apps frontend se actualizaron); `verifyMfaChallenge`, `enrollMfa`, `confirmMfa`, `disableMfa`.

## Frontend

- **`apps/admin`**: `/login` gana un segundo paso condicional — si `login()` devuelve `mfaRequired: true`, se muestra un formulario de código de 6 dígitos que llama a `completeMfaLogin` (nuevo método del `AuthProvider`, envuelve `verifyMfaChallenge`); `/profile` gana una sección "Autenticación en dos pasos (MFA)" con tres estados (desactivada → botón Activar; pendiente de confirmar → QR + secreto + campo de código; activada → campo de código + botón Desactivar).
- **`apps/web`**: el `AuthProvider` del storefront también actualiza su tipo de retorno de `login()` a la nueva unión, pero lanza un error defensivo si `mfaRequired` fuera `true` — un cliente nunca puede tener MFA activo (`canUseMfa()` lo impide en el backend), así que esta rama no debería alcanzarse en la práctica; se maneja igual por completitud de tipos.

## Verificación en vivo

Contra Railway (Postgres/Redis reales) con el administrador de prueba (`SUPER_ADMIN`) y un cliente de prueba existente de sesiones previas.

**Ciclo completo de MFA por API**: enroll → código TOTP generado con la misma librería (`otplib`) contra el secreto real devuelto → confirm (`204`) → login devuelve `{"mfaRequired":true,"challengeToken":"..."}` → intento con código incorrecto (`401 INVALID_MFA_CODE`, desafío **no** invalidado) → reintento con el mismo `challengeToken` y código correcto (`200`, sesión emitida, `mfaEnabled: true` en el usuario devuelto) → reutilizar el mismo `challengeToken` una tercera vez (`401 MFA_CHALLENGE_INVALID` — uso único confirmado) → disable con código válido (`204`) → login vuelve a completarse directo (`mfaRequired: false`). Un cliente (`CUSTOMER`) intentando `POST /auth/mfa/enroll` recibe `403 MFA_NOT_APPLICABLE`.

**Por navegador** (`apps/admin`): login normal sin MFA; en `/profile`, clic en "Activar" dispara `POST /auth/mfa/enroll` (confirmado por red), el QR generado se renderiza correctamente y su contenido (leído del cuerpo real de la respuesta, no solo visualmente) coincide con el secreto mostrado en texto; código TOTP real generado a partir de ese secreto y confirmado desde el formulario (`204`, mensaje "Autenticación en dos pasos activada."); desactivación desde el mismo panel con un código vigente (`204`, mensaje "Autenticación en dos pasos desactivada."). Cuenta de verificación dejada sin MFA activo al finalizar.

**Health/observabilidad**: `GET /health/live` → `{"status":"ok"}`; `GET /health/ready` → `{"status":"ok","info":{"database":{"status":"up"},"redis":{"status":"up"}}}`; `GET /metrics` → métricas Prometheus válidas con la etiqueta `route` reflejando el patrón de ruta correctamente para múltiples endpoints reales.

**Backup**: `backup-db.sh` corrido contra la base real de Railway tras resolver la incompatibilidad de versión de `pg_dump` (ver arriba) — dump válido de 553 entradas TOC, verificado con `pg_restore --list`, archivo de prueba eliminado al finalizar (no se sube al repositorio).

**Prueba de carga**: ver tabla de resultados arriba — confirmado el bug de rate-limiting sobre `/health` y su corrección con una segunda corrida limpia.

**Workspace completo**: `pnpm turbo run typecheck`, `lint`, `build`, `test` (como comandos separados, por la lección de condición de carrera de `turbo.json` documentada en módulos anteriores) — 646 pruebas pasando, sin errores de tipos ni de lint nuevos.

## Alcance diferido

- **MFA obligatorio por política de rol** — hoy es opt-in por cuenta; forzar que todo `SUPER_ADMIN`/`ADMIN` tenga MFA activo antes de poder operar requeriría un flujo de onboarding forzado no pedido explícitamente por el spec.
- **Rotación automática de credenciales** (spec §3) — no existe un mecanismo de rotación programada para `JWT_ACCESS_SECRET`, `MFA_ENCRYPTION_KEY` ni credenciales SMTP; rotarlas hoy es un procedimiento manual (cambiar la variable de entorno y reiniciar, invalidando todas las sesiones activas en el caso del JWT secret).
- **SSRF** (spec §3) — no se implementó protección específica porque no existe superficie real: ningún módulo de este proyecto hace peticiones HTTP salientes a URLs suministradas por el usuario (los "proveedores" de pago/envío/tracking son todos adaptadores manuales o de consola, sin llamadas de red reales).
- **Trazas distribuidas** (spec §4) — no se integró un colector de tracing (Jaeger/Tempo/OpenTelemetry); los logs estructurados con `x-request-id` correlacionado cubren la trazabilidad básica de un request individual, pero no un grafo de spans entre servicios (tampoco hay múltiples servicios entre los cuales trazar en esta topología).
- **Dashboards de métricas** (spec §4) — `/metrics` expone el formato Prometheus; no se desplegó un Grafana ni se construyeron dashboards, porque requeriría infraestructura de monitoreo adicional fuera de este repositorio.
- **Alertas automáticas** (spec §4) — sin un Alertmanager/PagerDuty configurado, no hay alertas activas sobre las métricas expuestas.
- **Backups automatizados con cron real** — los scripts son funcionales y verificados manualmente contra Railway; programarlos (GitHub Actions Schedule, o el cron nativo de Railway) y probar una restauración completa end-to-end en un proyecto aislado queda pendiente.
- **Pruebas de carga contra endpoints con escritura** — la prueba real se limitó a `/health/live` (idempotente, sin efectos secundarios) para no generar datos de prueba masivos en la base compartida de Railway sin un entorno de staging dedicado.
- **Actualización de dependencias vulnerables** — las 51 (dev) y 34 (prod) vulnerabilidades reportadas por `pnpm audit` no se resolvieron en este cambio; requieren una campaña de actualización mayor (Next.js 14 → 15, ESLint 8 → 9) evaluada aparte por su potencial de romper compatibilidad.

## Checklist de lanzamiento a producción

Basado en los criterios de aceptación del spec (§11) y en lo verificado en esta sesión:

- [x] Headers de seguridad (CSP, HSTS, X-Frame-Options) — `helmet()`.
- [x] Rate limiting — `@nestjs/throttler` (aplicación) + Nginx (borde).
- [x] MFA disponible para personal interno.
- [x] Health checks con liveness/readiness separados.
- [x] Métricas expuestas en formato Prometheus.
- [x] Logs estructurados con redacción de secretos y correlación por request.
- [x] Auditoría de accesos (login, cambios de rol, MFA) y de configuración administrativa (módulos previos).
- [x] Scripts de backup/restore verificados contra la base real.
- [x] Prueba de carga básica ejecutada y bug de rate-limiting corregido.
- [x] Pipeline CI con lint/typecheck/build/test, auditoría de dependencias visible, análisis estático (CodeQL).
- [ ] Backups programados automáticamente (requiere cron externo — ver "Alcance diferido").
- [ ] Restauración completa probada en un ambiente aislado (requiere infraestructura adicional).
- [ ] Dependencias vulnerables (Next.js 14, toolchain de ESLint) actualizadas.
- [ ] Dashboards y alertas sobre las métricas expuestas (requiere Grafana/Alertmanager).
- [ ] MFA exigido por política para roles privilegiados (hoy es opcional).
- [ ] `MFA_ENCRYPTION_KEY` y `JWT_ACCESS_SECRET` rotados a valores generados específicamente para producción (no los defaults de desarrollo).

## Cierre de la sesión

Con 035 se completan diez módulos implementados de principio a fin en esta sesión: los nueve de la tanda original "Continua:" (026 CMS Pages → 034 Notifications) más este, agregado explícitamente por el usuario tras el cierre de esa tanda. No queda ningún spec adicional pendiente en `Documents/Promps ecommerce/` sin implementar.
