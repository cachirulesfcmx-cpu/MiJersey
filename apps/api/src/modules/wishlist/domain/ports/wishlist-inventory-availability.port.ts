/** Lectura propia de Wishlist sobre `inventory_items` — mismo patrón que `CartInventoryAvailabilityPort` (017). */
export interface WishlistInventoryAvailabilityPort {
  getAvailabilityMany(variantIds: string[]): Promise<Map<string, number>>;
}
