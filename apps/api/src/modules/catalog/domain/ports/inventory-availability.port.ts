/**
 * Lectura propia de Catalog sobre `inventory_items` vía Prisma directo — Inventory (009)
 * no exporta nada para otros módulos, así que la PDP pública lee su tabla directamente,
 * mismo patrón CQRS que el resto de lecturas cruzadas del proyecto.
 */
export interface InventoryAvailabilityPort {
  /** Suma `availableQuantity` (ya neto de reservas) entre todos los almacenes, por variantId. */
  getAvailability(variantIds: string[]): Promise<Map<string, number>>;
}
