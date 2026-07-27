import { InventoryConcurrencyError } from '../../domain/errors/inventory.errors';

/**
 * Reintenta una operación de escritura optimista (bloqueo por `version`) hasta
 * `maxRetries` veces; cada intento debe releer el ítem actual antes de calcular
 * el delta, ya que la versión pudo cambiar en el intento anterior.
 */
export async function applyMovementWithRetry<T>(
  attempt: () => Promise<T | null>,
  maxRetries: number,
): Promise<T> {
  for (let i = 0; i < maxRetries; i += 1) {
    const result = await attempt();
    if (result !== null) return result;
  }
  throw new InventoryConcurrencyError();
}
