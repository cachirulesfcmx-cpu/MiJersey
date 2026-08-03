/**
 * Lectura propia de Reviews sobre `products`/`order_items` vía Prisma directo — sin importar
 * CatalogModule/OrdersModule, mismo patrón CQRS que `HomeLookupPort` (013) y
 * `ProductDetailLookupPort` (015).
 */
export interface ReviewProductLookupPort {
  /** Solo productos públicos pueden recibir reseñas — null si no existe o no es ACTIVE+PUBLIC. */
  findPublicProductBySlug(slug: string): Promise<{ id: string; slug: string; name: string } | null>;
  /** True si el cliente tiene al menos un pedido pagado (`PaymentStatus.PAID`) que incluya este producto. */
  hasVerifiedPurchase(customerId: string, productId: string): Promise<boolean>;
}
