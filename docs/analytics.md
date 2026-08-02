# Analytics

Implementación de [`docs/prompts/032-Analytics.md`](prompts/032-Analytics.md). Módulo nuevo (`apps/api/src/modules/analytics`) que agrega reportes de ventas, clientes y productos sobre datos ya existentes de otros módulos (Orders/Catalog/Identity), un dashboard ejecutivo, exportación CSV y dashboards configurables — explícitamente fuera de alcance los modelos predictivos y los embudos de conversión reales (no hay todavía un productor de eventos de sesión/página vista).

## Puerto de solo lectura sobre tablas de otros módulos ("decoupled reference")

`AnalyticsQueryRepositoryPort` consulta `Order`/`OrderItem`/`User` directamente vía Prisma, sin importar `OrdersModule` ni `IdentityModule` — mismo criterio que `CustomerOrderLookupPort` (019): un módulo de reportes no debe acoplar módulos de negocio a su existencia. `AnalyticsEvent`, igual que `AuditLogEntry`/`NavigationItem.target`/`Payment.orderId`, no tiene FK a ninguna tabla: `entityType`/`entityId` son strings libres.

## Definición de "venta contada"

No existe un campo `total` único en `Order` (`grandTotal Decimal`, `currency` string separado, sin conversión multi-moneda). Se distinguieron dos criterios:

- **Ingresos** (`getSalesSummary`, tendencia diaria, top productos): pedidos con `paymentStatus: PAID` y `status NOT IN [CANCELLED, REFUNDED]` — solo dinero efectivamente cobrado y no devuelto.
- **Volumen de pedidos** (`orderCount` en el dashboard ejecutivo y en `getSalesSummary`): cualquier pedido con `status != CANCELLED`, sin importar el pago — incluye `PENDING`/`CONFIRMED`/`REFUNDED`.

## Bucketing de fechas en JS, no en SQL

Prisma no puede truncar fechas en `groupBy`, así que `getSalesTrend` trae los pedidos filtrados por rango (acotado a 366 días por `resolveDateRange`) y los agrupa por día en memoria. Es una decisión deliberada de simplicidad: es una consulta cacheada, solo para el panel admin, no un camino caliente.

## Clientes nuevos vs. recurrentes

`getCustomerInsights` hace un `groupBy` **sin filtrar por fecha** sobre `customerId` con `_min: { createdAt }` para obtener la fecha de la primera compra histórica de cada cliente, y por separado un `groupBy` **acotado al rango** para el ranking de top clientes. Un cliente es "nuevo" si esa primera compra global cae dentro del rango solicitado; "recurrente" si compró dentro del rango pero su primera compra es anterior. El nombre/email se resuelve con un segundo `User.findMany` (sin relación Prisma entre `Order.customerId` y `User`, mismo patrón "decoupled reference").

## Caché con TTL, no el patrón "sin TTL" de los módulos de contenido

Theme/SiteConfiguration/EmailTemplates cachean sin expiración porque un único evento explícito (publicar, o el propio `PATCH`) reseedea la clave. Aquí no existe ese evento: los reportes resumen pedidos reales que cambian continuamente sin un momento de "publicación". `AnalyticsCacheService` usa `redis.client.setex(key, 300, json)` — mismo criterio que `TaxonomyCacheService`/`CmsCacheService` (006/026), TTL de 5 minutos. Verificado en vivo: la clave `analytics:dashboard:from=...&to=...` aparece en Redis con TTL 299s justo después de la primera consulta.

## Índice añadido a `Order` desde la migración de Analytics

La spec (§8) exige "consultas indexadas" para los rangos de fecha de los reportes. `Order` no tenía índice en `createdAt` (owned conceptualmente por Orders/Checkout). Se añadió `@@index([createdAt])` directamente al modelo `Order` en una migración separada (`add_order_created_at_index`) de la que crea las tablas nuevas de Analytics (`add_analytics`) — cambio puramente aditivo, no requiere tocar código de aplicación de Orders.

## Auditoría selectiva: no cada lectura de reporte

Auditar cada carga de dashboard/reporte inundaría el log en cada refresco de página. Solo se audita lo que la spec (§10) nombra explícitamente por tipo: `analytics.report_exported` (los datos salen del sistema como archivo) y `analytics.dashboard_created/updated/deleted` (cambios de configuración). Los "accesos administrativos" del mismo §10 ya quedan cubiertos por `PermissionsGuard` + JWT en cada endpoint, sin necesitar una fila de auditoría por lectura.

## Colector de eventos: puerto interno y extensión HTTP admin

`RecordAnalyticsEventUseCase` está pensado para ser invocado en proceso (inyectando el caso de uso) desde futuros módulos productores (021 Orders, 024 Promotions, 027 Blog, 033 Tracking) sin pasar por HTTP — pero también se expone como `POST /admin/analytics/events`, una extensión sobre la lista mínima de endpoints del spec (§7 solo enumera GETs), igual que Theme/Navigation extendieron su lista mínima con `/versions` cuando el modelo de dominio lo pedía.

## Permisos: lecturas bajo `admin:access`, mutaciones bajo `catalog:manage`

Consultar reportes no es una acción crítica del sistema (a diferencia de Site Configuration, `system:configure`) ni edita contenido — cualquier rol con acceso al panel puede leerlos. Registrar eventos, exportar y gestionar dashboards configurables sí mutan/generan datos, así que exigen `catalog:manage`. Verificado en vivo: un usuario `SUPPORT` (solo `admin:access`) obtiene `200` en `GET /admin/analytics/dashboard` pero `403` en `POST /admin/analytics/events`, `GET /admin/analytics/export` y `POST /admin/analytics/dashboards`.

## Dashboards configurables: CRUD propio más allá del GET literal del spec

El spec (§7) solo lista `GET /analytics/dashboard` (el ejecutivo, computado). La spec también pide (§12) que "los dashboards sean configurables", lo que exige persistir una entidad `AnalyticsDashboard` (nombre, `widgets` JSON, `filters` JSON opcional) con su propio CRUD — mismo criterio de extensión que los endpoints `/versions` de Theme/Navigation.

## Endpoints

| Método | Ruta                              | Auth             | Descripción                                                                    |
| ------ | --------------------------------- | ---------------- | ------------------------------------------------------------------------------ |
| GET    | `/admin/analytics/dashboard`      | `admin:access`   | Dashboard ejecutivo: ventas, clientes nuevos, catálogo activo, top 5 productos |
| GET    | `/admin/analytics/sales`          | `admin:access`   | Resumen + tendencia diaria de ventas                                           |
| GET    | `/admin/analytics/customers`      | `admin:access`   | Nuevos vs. recurrentes + top clientes por gasto                                |
| GET    | `/admin/analytics/products`       | `admin:access`   | Productos más vendidos por ingreso/unidades                                    |
| GET    | `/admin/analytics/events`         | `admin:access`   | Listado paginado de eventos, filtrable por tipo/entidad/fecha                  |
| POST   | `/admin/analytics/events`         | `catalog:manage` | Registra un evento (colector interno, sin auditoría individual)                |
| GET    | `/admin/analytics/export`         | `catalog:manage` | Exporta CSV (`type=sales\|customers\|products\|events`), audita el evento      |
| GET    | `/admin/analytics/dashboards`     | `admin:access`   | Lista dashboards configurables                                                 |
| GET    | `/admin/analytics/dashboards/:id` | `admin:access`   | Detalle de un dashboard                                                        |
| POST   | `/admin/analytics/dashboards`     | `catalog:manage` | Crea un dashboard, audita `dashboard_created`                                  |
| PATCH  | `/admin/analytics/dashboards/:id` | `catalog:manage` | Actualiza un dashboard, audita `dashboard_updated`                             |
| DELETE | `/admin/analytics/dashboards/:id` | `catalog:manage` | Elimina un dashboard, audita `dashboard_deleted`                               |

Todos los `GET` de rango aceptan `from`/`to` (ISO 8601); por defecto los últimos 30 días, máximo 366 días de span (`resolveDateRange`).

## Auditoría

`AuditLogRepositoryPort` registra: `analytics.report_exported`, `analytics.dashboard_created`, `.updated`, `.deleted`.

## SDK

- `packages/sdk/src/analytics.types.ts`: `ExecutiveDashboardView`, `SalesReportView`, `CustomerInsights`, `TopProduct`, `AnalyticsDashboard`/`AnalyticsWidget`, `AnalyticsEvent`, tipos de export.
- `api-client.ts`: `getExecutiveDashboard`, `getSalesReport`, `getCustomerInsights`, `getProductPerformance`, `listAnalyticsEvents`, `recordAnalyticsEvent`, `exportAnalyticsReport` (hace su propio `fetch` fuera de `request()` porque la respuesta es `text/csv`, no JSON — extrae el `filename` del header `Content-Disposition`), CRUD completo de `*AnalyticsDashboard*`.

## Frontend

- **Admin**: `/analytics` — selector de rango de fechas, KPI Cards del dashboard ejecutivo, tabla de tendencia de ventas, tabla de clientes (nuevos/recurrentes + top clientes), tabla de productos más vendidos, botones de exportación CSV por reporte (descarga vía `Blob`/`URL.createObjectURL`) y exportación de eventos. `/analytics/dashboards` — CRUD de dashboards configurables; los `widgets` se editan como JSON crudo (sin builder visual arrastrable), mismo criterio "campos mínimos" que los editores JSON de Site Configuration.
- **Storefront**: sin cambios — módulo puramente administrativo.

## Verificación en vivo

Contra Railway (Postgres + Redis reales), con el administrador de prueba (`SUPER_ADMIN`) y un segundo usuario `SUPPORT` (solo `admin:access`) creado para esta verificación.

La base de datos no tenía pedidos reales (quedó vacía tras verificaciones previas de otros módulos); se creó un producto real vía `POST /admin/products` + `PATCH /:id/publish` y tres pedidos (`PAID`, `CONFIRMED`) insertados directamente contra las tablas `Order`/`OrderItem` con cantidades y fechas distintas, para poder ejercer las agregaciones con datos relacionales reales. Se confirmó por API que `orderCount`, `revenue`, `averageOrderValue`, la tendencia diaria, `topProducts` (unidades/ingreso) y `topCustomers` cuadran aritméticamente con los pedidos insertados. Tanto los pedidos de prueba como el producto se eliminaron al terminar la verificación.

**Por API (curl)**: dashboard ejecutivo, ventas, clientes y productos devuelven datos consistentes entre sí para el mismo rango; un rango mayor a 366 días devuelve `400 RANGE`; la caché de Redis confirma TTL 299s (configurado en 300s) inmediatamente después de una consulta; `POST /admin/analytics/events` + `GET /admin/analytics/events` funcionan; `GET /admin/analytics/export?type=sales` devuelve `Content-Type: text/csv` y `Content-Disposition: attachment` con el CSV correcto, igual para `type=events`; el log de auditoría registra `analytics.report_exported` con el tipo y rango; CRUD completo de dashboards configurables (crear, listar, obtener, actualizar, eliminar, `404` tras eliminar); el usuario `SUPPORT` obtiene `200` en los cuatro `GET` de reportes pero `403` en `POST /events`, `GET /export` y `POST /dashboards`.

**Por navegador**: en `apps/admin`, `/analytics` carga el selector de rango y las KPI Cards (en `0` tras limpiar los datos de prueba, confirmando el estado vacío correcto); `/analytics/dashboards` permite crear un dashboard de prueba (aparece en la tabla con sus widgets), y eliminarlo con el `ConfirmDialog` estándar del proyecto.

## Alcance diferido

- **Embudos de conversión / funnels reales** (spec §6 "conversión") — no existe todavía ningún módulo productor de eventos de sesión/página vista (033-Tracking-Pixels aún no se implementa en este sprint, y 021/024/027 no fueron modificados para emitir eventos en esta pasada), así que se limita a KPI cards/conteo de eventos genéricos en vez de datos de embudo fabricados.
- **Modelos predictivos** — excluidos explícitamente por la spec (§13 "No incluye modelos predictivos").
- **Integración activa de productores de eventos** — `RecordAnalyticsEventUseCase` está listo para ser invocado en proceso por Orders/Promotions/Blog/Tracking, pero ninguno de esos módulos fue modificado todavía para llamarlo.
