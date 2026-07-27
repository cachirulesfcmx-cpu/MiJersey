import type { InventoryItemEntity } from '../entities/inventory-item.entity';
import type { InventoryMovementEntity } from '../entities/inventory-movement.entity';
import type { CreateMovementData } from './inventory-movement.repository.port';

export interface InventoryDelta {
  availableDelta?: number;
  reservedDelta?: number;
  incomingDelta?: number;
  safetyStock?: number;
}

export interface ApplyMovementInput {
  itemId: string;
  version: number;
  delta: InventoryDelta;
  movement: Omit<CreateMovementData, 'inventoryItemId'>;
}

export interface ApplyMovementResult {
  item: InventoryItemEntity;
  movement: InventoryMovementEntity;
}

export interface ListInventoryFilter {
  variantId?: string;
  warehouseId?: string;
  variantIds?: string[];
  belowSafetyStock?: boolean;
}

export interface ListInventoryParams {
  filter?: ListInventoryFilter;
  page: number;
  pageSize: number;
}

export interface ListInventoryResult {
  items: InventoryItemEntity[];
  total: number;
}

export interface InventoryItemRepositoryPort {
  findById(id: string): Promise<InventoryItemEntity | null>;
  findByVariantAndWarehouse(
    variantId: string,
    warehouseId: string,
  ): Promise<InventoryItemEntity | null>;
  findByVariant(variantId: string): Promise<InventoryItemEntity[]>;
  findMany(params: ListInventoryParams): Promise<ListInventoryResult>;
  /** Crea el ítem si no existe (cantidades en cero); devuelve el existente si ya estaba creado. */
  findOrCreate(variantId: string, warehouseId: string): Promise<InventoryItemEntity>;
  /** Actualiza solo el umbral de alerta; no genera movimiento (no es una cantidad de stock). */
  updateSafetyStock(id: string, safetyStock: number): Promise<InventoryItemEntity>;
  /**
   * Aplica el delta y registra el movimiento en una única transacción, bajo bloqueo
   * optimista (`WHERE id = ? AND version = ?`). Devuelve `null` si la versión ya no
   * coincide (conflicto de concurrencia) — el caso de uso decide si reintentar.
   */
  applyMovement(input: ApplyMovementInput): Promise<ApplyMovementResult | null>;
}
