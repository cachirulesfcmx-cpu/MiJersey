import type { InventoryMovementEntity } from '../entities/inventory-movement.entity';
import type { InventoryMovementType } from '../value-objects/inventory-enums';

export interface CreateMovementData {
  inventoryItemId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string;
}

export interface ListMovementsFilter {
  inventoryItemId?: string;
  variantId?: string;
  warehouseId?: string;
  type?: InventoryMovementType;
  referenceType?: string;
  referenceId?: string;
}

export interface ListMovementsParams {
  filter?: ListMovementsFilter;
  page: number;
  pageSize: number;
}

export interface ListMovementsResult {
  items: InventoryMovementEntity[];
  total: number;
}

/** De solo lectura: todo movimiento se crea de forma atómica junto a su ítem vía `InventoryItemRepositoryPort.applyMovement`. */
export interface InventoryMovementRepositoryPort {
  findMany(params: ListMovementsParams): Promise<ListMovementsResult>;
}
