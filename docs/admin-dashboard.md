# Panel administrativo

Implementación de [`docs/prompts/004-Admin-Dashboard.md`](prompts/004-Admin-Dashboard.md). El backend agrega el módulo `apps/api/src/modules/administration` (lectura de auditoría + métricas) sobre el dominio Identity de [`003-Authentication-Authorization`](authentication.md); el frontend vive en `apps/admin`.

## Módulo Administration (backend)

Separación CQRS entre módulos: `Identity` es dueño de la escritura de auditoría (`AuditLogRepositoryPort`, se registra en cada acción sensible: login, cambios de rol, etc.), `Administration` es dueño de la lectura (`AuditLogQueryPort`) contra la misma tabla `audit_logs`. Esto evita que el módulo de lectura necesite conocer cómo se escriben los eventos, y viceversa.

| Método | Ruta                        | Permiso           | Descripción                                    |
| ------ | --------------------------- | ----------------- | ---------------------------------------------- |
| GET    | `/admin/dashboard/metrics`  | `admin:access`    | KPIs del panel (ver "Métricas parciales")      |
| GET    | `/admin/dashboard/activity` | `admin:access`    | Últimos eventos de auditoría                   |
| GET    | `/admin/audit-log`          | `admin:access`    | Auditoría paginada, filtrable por acción/fecha |
| GET    | `/admin/users`              | `identity:manage` | Lista paginada de staff                        |
| POST   | `/admin/users`              | `identity:manage` | Crea un usuario de staff                       |
| PATCH  | `/admin/users/:id/role`     | `identity:manage` | Cambia el rol de un usuario                    |
| PATCH  | `/admin/users/:id/status`   | `identity:manage` | Activa/desactiva un usuario                    |
| GET    | `/admin/roles`              | `admin:access`    | Roles y sus permisos                           |

### Métricas parciales

`DashboardMetrics` expone cada KPI como `{ value: number; available: boolean }`. `customers`, `staff` y `activeUsers` son reales (`available: true`, calculados por `GetUserStatsUseCase` del módulo Identity). `sales`, `orders`, `products`, `revenue`, `conversionRate` e `inventoryAlerts` devuelven `{ value: 0, available: false }` porque dependen de módulos que aún no existen (Catálogo, Pedidos — `005+`). El frontend usa `available` para mostrar "No disponible aún" en vez de un cero engañoso.

## Frontend (`apps/admin`)

- **Shell protegido**: `app/(dashboard)/layout.tsx` agrupa Dashboard/Usuarios/Roles/Auditoría/Perfil bajo un layout común (sidebar colapsable persistida en `localStorage`, breadcrumbs, RBAC visual) sin afectar las URLs, vía un route group de Next.js.
- **RBAC visual**: cada item de navegación declara un `permission` opcional; `hasPermission()` (del `AuthProvider`) filtra los que el usuario no puede ver. El guard de layout redirige a `/login` si no hay sesión o falta `admin:access`.
- **Páginas**: Dashboard (KPIs con `KpiCard`, estado vacío para métricas no disponibles), Usuarios (`DataTable` + alta/edición de rol/estado), Roles (solo lectura), Auditoría (filtro por acción + paginación), Perfil (datos básicos + cambio de contraseña).
- **Componentes nuevos en `@mijersey/ui`**: `DataTable`, `KpiCard`, `EmptyState`, `ConfirmDialog` (usa `<dialog>` nativo para accesibilidad).

## Bug encontrado durante la verificación: `ApiClient` y el receptor de `fetch`

Al probar el login en un navegador real (no solo con `curl`), la UI mostraba "No se pudo iniciar sesión" de forma intermitente aunque el backend respondía `200` cuando se probaba directamente. La causa: `ApiClient` guardaba `fetch` como propiedad de instancia (`this.fetchImpl = options.fetchImpl ?? fetch`) y lo invocaba como `this.fetchImpl(...)`. Al llamar un método nativo de `Window` con un receptor distinto a `window`, Chrome lanza `TypeError: Failed to execute 'fetch' on 'Window': Illegal invocation` — un error que no es `ApiClientError`, así que el `catch` del login mostraba el mensaje genérico sin pista real del problema.

Corregido en [`packages/sdk/src/api-client.ts`](../packages/sdk/src/api-client.ts) enlazando el receptor por defecto: `fetch.bind(globalThis)`. Afecta a `@mijersey/sdk` completo, por lo que corrige tanto `apps/admin` como `apps/web`. Verificado en el navegador: login → dashboard → navegación entre las 5 páginas, todo contra el Postgres real de Railway.

## Alcance diferido

Deliberadamente fuera de este sprint (se retoman si un prompt futuro los requiere): paleta de comandos/búsqueda global, atajos de teclado, virtualización de tablas grandes, y componentes genéricos `Select`/`Modal`/`Drawer` (por ahora cada página resuelve sus propios casos con lo que ya existe en `@mijersey/ui`).
