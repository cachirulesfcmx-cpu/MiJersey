/** Lectura propia de Checkout sobre `inventory_items` — mismo patrón que `CartInventoryAvailabilityPort` (017): cada módulo consumidor construye su propia lectura en vez de importar `InventoryModule`. Usada para la revalidación final de stock en `ConfirmCheckoutUseCase` (spec §5 "validar stock antes de confirmar"). */
export interface CheckoutInventoryAvailabilityPort {
  getAvailabilityMany(variantIds: string[]): Promise<Map<string, number>>;
}
