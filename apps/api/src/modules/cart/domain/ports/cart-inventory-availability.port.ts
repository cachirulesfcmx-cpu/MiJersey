/** Lectura propia de Cart sobre `inventory_items` — mismo patrón que `InventoryAvailabilityPort` de Catalog (015): cada módulo consumidor construye su propia lectura en vez de importar `InventoryModule`, que no exporta nada. */
export interface CartInventoryAvailabilityPort {
  getAvailability(variantId: string): Promise<number>;
  getAvailabilityMany(variantIds: string[]): Promise<Map<string, number>>;
}
