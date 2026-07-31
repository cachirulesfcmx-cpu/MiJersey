# Customer Service

Implementación de [`docs/prompts/025-Customer-Service.md`](prompts/025-Customer-Service.md). Módulo nuevo (`apps/api/src/modules/support`) que agrega tickets de soporte, conversación cliente-agente con notas internas, un motor de SLA, y devoluciones (RMA) preparadas — integrado con Orders (021) por id, sin cambios estructurales.

## Autenticación obligatoria en todo el módulo

A diferencia de Cart/Promotions (que aceptan invitados) o Shipping (que expone tracking público), la spec de Customer Service exige "autenticación obligatoria" (§9) sin excepciones. `SupportController` (`/support/*`) y `AdminSupportController` (`/admin/support/*`) no llevan `@Public()`: el guard global `JwtAuthGuard` los cubre igual que `/orders` (021) y `/wishlist` (020). No existe ningún endpoint anónimo en este módulo.

## Un mismo motor de casos de uso para cliente y agente

`GetTicketUseCase`, `ListTicketMessagesUseCase` y `ReplyToTicketUseCase` reciben `customerId: string | null` — `null` significa "lo consulta un agente/admin, que puede ver cualquier ticket"; un id real fuerza la comprobación de propiedad (404, no 403, si el ticket es de otro cliente — mismo criterio que `GetOrderUseCase`, 021). `SupportController` siempre pasa `user.sub`; `AdminSupportController` siempre pasa `null`. Esto evita duplicar la lógica de conversación/respuesta en dos módulos separados.

## SLA medible sin un job en segundo plano

`calculateSlaDueDates(priority, createdAt)` fija `firstResponseDueAt`/`resolutionDueAt` en el momento de crear el ticket, según una tabla fija de horas por prioridad (`URGENT` 1h/4h, `HIGH` 4h/24h, `MEDIUM` 8h/48h, `LOW` 24h/72h). El incumplimiento (`firstResponseBreached`/`resolutionBreached`) no se persiste ni se recalcula por un cron: `TicketEntity.toJSON(now)` lo deriva comparando esas fechas contra `now()` en el momento de la lectura — spec §8 "los SLA puedan medirse" queda satisfecho sin infraestructura adicional.

## Las respuestas mueven el estado automáticamente

Spec §4 "las respuestas deberán actualizar el estado cuando corresponda", implementado en `ReplyToTicketUseCase`:

- Una respuesta pública del agente fija `firstRespondedAt` (si es la primera) y pasa el ticket a `WAITING_CUSTOMER` — se espera que el cliente conteste.
- Una **nota interna** del agente (`isInternal: true`) también fija `firstRespondedAt` pero no mueve a `WAITING_CUSTOMER`: solo saca al ticket de `OPEN` a `IN_PROGRESS` si aún no se había atendido. Una nota interna no es una respuesta al cliente.
- Una respuesta del cliente desde `WAITING_CUSTOMER` o `RESOLVED` regresa el ticket a `IN_PROGRESS` — necesita atención del agente de nuevo.
- Un ticket `CLOSED` no admite nuevas respuestas (`409 TICKET_CLOSED`); reabrirlo es una acción explícita vía `PATCH /admin/support/tickets/:id`.

## Notas internas: visibles solo para quien las escribió con ese propósito

`TicketMessage.isInternal` (spec §4 "Solo usuarios autorizados podrán ver notas internas") se filtra en el repositorio, no en el controlador: `ListTicketMessagesUseCase` pasa `includeInternal: customerId === null` a `TicketMessageRepositoryPort.findMany`, que excluye `isInternal: true` de la consulta SQL cuando es un cliente quien pregunta. Un cliente nunca recibe una nota interna en la respuesta, ni siquiera con el campo oculto en el JSON — no llega desde la base de datos.

## RMA preparada: sin generar un envío de retorno real

Spec §2/§4 pide "Devoluciones (RMA) preparadas" e "integración con devoluciones" — no un flujo logístico completo. `CreateRmaUseCase` valida la propiedad del pedido (reutilizando `GetOrderUseCase`, 021) y crea el registro `RmaRequest`; si no se referencia un ticket existente, crea uno nuevo de categoría `RETURN_REFUND` para que la devolución nunca quede huérfana de un historial (spec §4 "Cada ticket tendrá un historial completo"). No se genera automáticamente un envío de retorno en Shipping (023): ese paso operativo queda fuera de alcance de este sprint, siguiendo el mismo criterio de "preparado, no ejecutado" que Shipping usó para transportistas reales sin credenciales.

## Adjuntos como URLs, no como binarios

`TicketMessage.attachments` es un arreglo de URLs (validadas con `@IsUrl` en el DTO), no un pipeline de subida de archivos propio. "Almacenamiento eficiente de adjuntos" (spec §8) se resuelve reutilizando activos ya subidos a Media Library (010) o cualquier URL válida — evita duplicar infraestructura de subida que ya existe en el sistema.

## Endpoints

| Método    | Ruta                                            | Auth           | Descripción                                                                                              |
| --------- | ----------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| GET       | `/support/tickets`                              | JWT            | Tickets propios del cliente, paginado y filtrable por estado/prioridad                                   |
| POST      | `/support/tickets`                              | JWT            | Crea un ticket; valida la propiedad del pedido si se referencia uno                                      |
| GET       | `/support/tickets/:id`                          | JWT            | Detalle de un ticket propio                                                                              |
| GET       | `/support/tickets/:id/messages`                 | JWT            | Conversación paginada (carga diferida), sin notas internas                                               |
| POST      | `/support/tickets/:id/reply`                    | JWT            | Respuesta del cliente (`isInternal` siempre `false`)                                                     |
| POST      | `/support/rma`                                  | JWT            | Solicita una devolución; crea un ticket `RETURN_REFUND` si no se referencia uno                          |
| GET/PATCH | `/admin/support/tickets`                        | `admin:access` | Listado completo con filtros de agente/estado/prioridad; actualización de estado, prioridad y asignación |
| GET/POST  | `/admin/support/tickets/:id/messages`, `/reply` | `admin:access` | Conversación completa (incluye notas internas) y respuesta de agente                                     |
| GET/PATCH | `/admin/support/rma`                            | `admin:access` | Listado y actualización de estado de solicitudes de devolución                                           |

## Auditoría

`AuditLogRepositoryPort` (Identity) registra: `support.ticket.created`, `support.ticket.replied`, `support.ticket.status_changed`, `support.ticket.closed`, `support.ticket.assigned`, `support.rma.requested`, `support.rma.status_changed`.

## SDK

- `packages/sdk/src/support.types.ts`: `Ticket`, `TicketMessage`, `RmaRequest`, tipos de categoría/prioridad/estado, inputs de creación/actualización.
- `api-client.ts`: cliente — `listMyTickets`, `createTicket`, `getMyTicket`, `listMyTicketMessages`, `replyToMyTicket`, `requestRma`; admin — `listAllTickets`, `getTicket`, `listTicketMessages`, `replyToTicket`, `updateTicket`, `listRma`, `updateRmaStatus`.

## Frontend

- **Admin**: `/support-tickets` ("Tickets de soporte") — Support Dashboard con filtros de estado/prioridad e indicador de SLA por fila; `/support-tickets/:id` — Ticket Detail con Conversation Timeline (notas internas resaltadas), Reply Editor (con casilla de nota interna) e indicadores de SLA con fecha límite. `/support-rma` ("Devoluciones (RMA)") — listado con cambio de estado inline. Rutas nombradas `support-tickets`/`support-rma` (no `support`) para evitar la colisión de prefijos en `pathname.startsWith()` del sidebar, mismo cuidado que `shipping-config` vs `shipping-methods` (023).
- **Storefront**: `/account/support` ("Mis tickets") — lista de tickets propios; `/account/support/new` — formulario de creación, preselecciona categoría "Problema con un pedido" cuando llega desde `/account/orders/:id` vía `?orderId=`; `/account/support/:id` — Conversation Timeline + Reply Editor, sin editor visible si el ticket está `CLOSED`. El detalle de pedido (`/account/orders/:id`) incluye el enlace "¿Necesitas ayuda con este pedido?" hacia el formulario de creación con el pedido preseleccionado.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): un cliente de prueba, un agente/admin de prueba, y un pedido pagado del cliente.

**Por API (curl)**: creación de tickets sin pedido y con pedido propio (SLA calculado correctamente: 4h/24h para `HIGH`); creación con un pedido ajeno devuelve `404 ORDER_NOT_FOUND`; el cliente responde y ve su propio mensaje; `POST /support/rma` crea la solicitud y un ticket `RETURN_REFUND` automáticamente; el agente responde públicamente (mueve a `WAITING_CUSTOMER`, fija `firstRespondedAt`) y agrega una nota interna (no cambia a `WAITING_CUSTOMER`); el cliente confirma que la nota interna nunca aparece en su vista de mensajes; el agente asigna el ticket, baja la prioridad y lo cierra (`closedAt` se fija); responder a un ticket cerrado devuelve `409 TICKET_CLOSED`; `GET/PATCH /admin/support/rma` lista y aprueba la devolución; endpoints admin sin token devuelven `401`, con token de cliente devuelven `403`; `/support/tickets` sin token devuelve `401` (autenticación obligatoria sin excepciones). El log de auditoría registra `support.ticket.created`, `.replied`, `.assigned`, `.closed`, `support.rma.requested` y `support.rma.status_changed`.

**Por navegador**: en `apps/admin`, `/support-tickets` muestra el Support Dashboard con SLA por fila; `/support-tickets/:id` permite responder (verificado end-to-end: el estado cambia a `WAITING_CUSTOMER` tras la respuesta) y actualizar estado/prioridad/asignación; `/support-rma` muestra la solicitud real con su estado. En el storefront, `/account/support` lista los tickets propios; el detalle de un ticket cerrado oculta el editor de respuesta y no muestra la nota interna del agente; el detalle de un ticket abierto permite responder (verificado: el estado pasa de `WAITING_CUSTOMER` a `IN_PROGRESS`); `/account/support/new?orderId=...` preselecciona la categoría correcta y crea el ticket con su primer mensaje en un solo flujo.

Toda la data de prueba (clientes, admin, pedido, producto, variante, tickets, mensajes, RMA) se eliminó de Railway al finalizar.

## Alcance diferido

- **Generación real de un envío de retorno en Shipping (023)** al aprobar una RMA — la spec pide la RMA "preparada", no el flujo logístico completo; `RmaStatus.APPROVED` es un estado administrativo sin efectos automáticos en Shipping.
- **Notificaciones por correo o push al cliente/agente** (spec §5 "integración con Notifications") — 031-Email-Templates y 034-Notifications no existen todavía en este backend; el módulo está diseñado para no requerir cambios estructurales cuando se implementen (mismo criterio que la Definition of Done exige explícitamente).
- **Subida de archivos propia para adjuntos** — `TicketMessage.attachments` acepta URLs válidas; no hay un endpoint de carga de binarios dedicado a Support (se apoya en Media Library, 010, o cualquier URL externa).
- **Chat en tiempo real** — explícitamente fuera de alcance en la spec (§2 "No incluye chat en tiempo real"); la conversación es asíncrona vía polling/recarga.
