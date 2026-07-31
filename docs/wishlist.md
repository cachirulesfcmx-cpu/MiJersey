# Wishlist

Implementación de [`docs/prompts/020-Wishlist.md`](prompts/020-Wishlist.md). Módulo nuevo (`apps/api/src/modules/wishlist`) que agrega una lista de deseos persistente por cliente, integrada con Catálogo, Inventario y Carrito.

## Solo la lista predeterminada, por ahora

El modelo (`Wishlist{id, customerId, name, isDefault, shareToken, items[]}`) ya soporta varias listas nombradas, pero la lista mínima de endpoints de la spec (§7: `GET /wishlist`, `POST /wishlist/items`, `DELETE /wishlist/items/:id`, `POST /wishlist/items/:id/move-to-cart`, `POST /wishlist/share`) solo opera sobre "la" wishlist, sin verbo para crear o cambiar entre varias. Se implementó exactamente eso: `GetOrCreateWishlistUseCase` resuelve (o crea de forma perezosa, igual que `CustomerProfile` en 019) la única lista `isDefault: true` del cliente en cada request. Administrar múltiples listas queda fuera de alcance hasta que una spec futura lo pida explícitamente — el esquema no requeriría cambios estructurales para soportarlo.

## Por qué la unicidad es por variante, no por producto

`@@unique([wishlistId, variantId])` en `WishlistItem` aplica la regla "no permitir elementos duplicados en la misma lista" (spec §4) a nivel de variante: dos variantes del mismo producto (tallas, colores) son artículos distintos para efectos de "mover al carrito", igual que en Cart (017). `AddWishlistItemUseCase` valida esto antes de insertar (para devolver `409 DUPLICATE_WISHLIST_ITEM` en vez de un error crudo de Postgres) y valida que la variante exista consultando Catálogo (`404 PRODUCT_NOT_FOUND` si no).

## Lectura propia sobre Catálogo e Inventario (mismo patrón CQRS de toda la sesión)

`WishlistProductLookupPort` y `WishlistInventoryAvailabilityPort` leen directamente las tablas de `ProductVariant`/`InventoryItem` (implementaciones `PrismaWishlistProductLookupRepository`/`PrismaWishlistInventoryAvailabilityRepository`), replicando el mismo criterio que `CartProductLookupPort`/`CartInventoryAvailabilityPort` en 017: Wishlist no importa `CatalogModule` ni `InventoryModule`, construye su propia lectura hacia sus tablas físicas.

**"Si un producto deja de existir, deberá marcarse como no disponible" (spec §4)** se resuelve completamente en lectura: `BuildWishlistViewUseCase` enriquece cada item con `isAvailable` (calculado a partir de `ProductVariant.status`/`Product.status`/`Product.visibility` vigentes) y `availableQuantity` en caliente — nunca se guarda ni causa que el item se borre. Un producto descontinuado simplemente aparece marcado como no disponible en la vista, con la variante e id de producto todavía presentes.

## Compartir: reutiliza `AddCartItemUseCase`, no lo duplica

**"Mover al carrito"** (`MoveWishlistItemToCartUseCase`) reutiliza `GetOrCreateCartUseCase` + `AddCartItemUseCase` de Cart (017) tal cual — se agregaron a los `exports` de `CartModule` (junto con los ya exportados de 018-Checkout). Toda la validación de disponibilidad-para-venta y stock ya vive ahí; Wishlist no la reimplementa. Tras agregar al carrito, el item se borra de la wishlist — es un "mover", no un "copiar". El endpoint requiere el mismo encabezado `x-session-id` que Cart, incluso para un cliente autenticado, porque `GetOrCreateCartUseCase` lo necesita para resolver o crear el carrito.

**"Compartir mediante enlace"** (`ShareWishlistUseCase`) genera un `shareToken` (`randomUUID()`) la primera vez que se llama y reutiliza el existente en llamadas subsecuentes — compartir dos veces no invalida un enlace ya distribuido. `GET /wishlist/shared/:token` es un endpoint público añadido más allá de la lista mínima de la spec — necesario para que "compartir" sea utilizable por alguien sin cuenta, mismo criterio que `GET /checkout/shipping-methods` (018) y `DELETE /cart/coupon` (017). Un token inexistente devuelve `404 SHARED_WISHLIST_NOT_FOUND` sin más detalle.

## Seguridad: autenticación obligatoria, a diferencia de Cart/Checkout

Spec §9 pide "autenticación obligatoria" — a diferencia de Cart y Checkout (que soportan invitados vía `x-session-id` + JWT opcional), `WishlistController` no tiene `@Public()` y usa el guard global `JwtAuthGuard`, igual que `/me` en 019. Solo `SharedWishlistController` (`/wishlist/shared/:token`) es público, porque el token en sí es la autorización.

**Propiedad, no permiso**: `RemoveWishlistItemUseCase` y `MoveWishlistItemToCartUseCase` comparan `item.wishlistId` contra la wishlist del cliente autenticado. Un item de otra wishlist se reporta como `404 WISHLIST_ITEM_NOT_FOUND`, nunca `403` — no revela que el recurso existe, mismo criterio que direcciones y pedidos ajenos en 019.

## Sincronización entre dispositivos y notificaciones: sin mecanismo adicional

**"Mantener la wishlist al cambiar de dispositivo o iniciar sesión" (spec §4)** se satisface automáticamente por diseño: la wishlist se persiste por `customerId` en el servidor, no en almacenamiento local del navegador — no hace falta ningún mecanismo de sincronización adicional.

**"Notificaciones de disponibilidad" (spec §2)** se deja explícitamente diferida — la propia spec la condiciona con "preparado para integración". El campo `isAvailable` calculado en cada lectura es la base sobre la que un futuro job (cron + email, fuera de alcance de este módulo) podría construirse; no se implementó ningún cron ni envío de correos.

## Endpoints

| Método | Ruta                               | Auth    | Descripción                                                               |
| ------ | ---------------------------------- | ------- | ------------------------------------------------------------------------- |
| GET    | `/wishlist`                        | JWT     | Wishlist predeterminada del cliente (se crea de forma perezosa)           |
| POST   | `/wishlist/items`                  | JWT     | Agrega una variante (409 si ya está en la lista)                          |
| DELETE | `/wishlist/items/:id`              | JWT     | Quita un item propio (404 si es de otra wishlist)                         |
| POST   | `/wishlist/items/:id/move-to-cart` | JWT     | Mueve el item al carrito (requiere `x-session-id`) y lo quita de la lista |
| POST   | `/wishlist/share`                  | JWT     | Genera (o reutiliza) el `shareToken` de enlace público                    |
| GET    | `/wishlist/shared/:token`          | Público | Vista de solo lectura de una wishlist compartida                          |

## Auditoría

`AuditLogRepositoryPort` (de Identity) registra: `wishlist.created`, `wishlist.item_removed`, `wishlist.item_moved_to_cart`, `wishlist.shared` — cubriendo los cuatro eventos que pide la spec §10.

## SDK

- `packages/sdk/src/wishlist.types.ts`: `Wishlist`, `WishlistItemView`, `AddWishlistItemInput`.
- `api-client.ts`: `getWishlist`, `addWishlistItem`, `removeWishlistItem`, `moveWishlistItemToCart`, `shareWishlist`, `getSharedWishlist`.

## Frontend storefront

- **`WishlistProvider`** (`providers/wishlist-provider.tsx`): mismo patrón que `CartProvider`, pero sin estado de invitado — sin `accessToken` la wishlist es simplemente `null`. Expone `isInWishlist(variantId)` para que el botón de la PDP sepa su estado sin una consulta adicional.
- **`WishlistButton`**: botón de corazón en la PDP (`ProductDetailClient.tsx`) que agrega/quita la variante activa; sin sesión, redirige a `/login` en vez de fallar.
- **`/wishlist`** (Wishlist Page): lista de items (`WishlistItemCard`) con acciones "Mover al carrito" y "Quitar", panel para compartir (`ShareWishlistPanel`), y estado vacío (`EmptyWishlist`).
- **`/wishlist/shared/[token]`**: página pública de solo lectura que consume `GET /wishlist/shared/:token` sin autenticación; permite agregar cada item al carrito propio de quien visita el enlace (no al carrito del dueño de la lista) reutilizando `useCart().addItem()`.
- Enlace "Mi lista de deseos" agregado al header de `/account`.

## Verificación en vivo

Contra Railway (Postgres + Redis reales): dos clientes de prueba, producto/variante/almacén/inventario de prueba.

**Por API (curl)**: `GET /wishlist` crea la lista predeterminada de forma perezosa; `POST /wishlist/items` agrega la variante y una segunda llamada con la misma variante devuelve `409 DUPLICATE_WISHLIST_ITEM`; el cliente B intentando eliminar un item del cliente A recibe `404 WISHLIST_ITEM_NOT_FOUND` (no `403`); sin encabezado de autorización, `401`; `POST /wishlist/share` genera un `shareToken`; `GET /wishlist/shared/:token` (sin auth) devuelve la vista pública, y un token inexistente devuelve `404 SHARED_WISHLIST_NOT_FOUND`; `POST /wishlist/items/:id/move-to-cart` mueve el item al carrito (confirmado con `GET /cart` mostrando el artículo) y lo quita de la wishlist.

**Por navegador**: login en `apps/web`; en la PDP, el botón de wishlist alterna entre "Agregar"/"Quitar" y dispara las llamadas correctas; `/wishlist` muestra el item agregado con imagen, precio y disponibilidad; el panel de compartir muestra el enlace existente; "Mover al carrito" vacía la wishlist y el artículo aparece en el Mini Cart con la cantidad correctamente sumada a una unidad ya presente del mismo producto.

Toda la data de prueba (clientes, producto, variante, almacén, inventario, carritos) se eliminó de Railway al finalizar.

## Alcance diferido

- **Gestión de varias listas nombradas** (crear, renombrar, borrar) — el esquema ya lo soporta (`name`, `isDefault`), pero ningún endpoint lo expone; ninguna spec lo pide todavía.
- **Notificaciones de disponibilidad** — explícitamente condicionado por la spec a "preparado para integración"; solo existe el campo `isAvailable` calculado como base futura.
- **Listas colaborativas** — excluido explícitamente por la spec (§2).
