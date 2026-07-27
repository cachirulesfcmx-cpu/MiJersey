export type WarehouseStatus = 'ACTIVE' | 'ARCHIVED';

export type InventoryMovementType =
  | 'INBOUND'
  | 'OUTBOUND'
  | 'RESERVATION'
  | 'RELEASE'
  | 'ADJUSTMENT_POSITIVE'
  | 'ADJUSTMENT_NEGATIVE'
  | 'RETURN';

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  status: WarehouseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseInput {
  code: string;
  name: string;
}

export interface UpdateWarehouseInput {
  name?: string;
  status?: WarehouseStatus;
}

export interface ListWarehousesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: WarehouseStatus;
}

export interface VariantSummary {
  id: string;
  productId: string;
  sku: string;
  title: string;
  productName: string;
  status: string;
}

export interface InventoryItem {
  id: string;
  variantId: string;
  warehouseId: string;
  availableQuantity: number;
  reservedQuantity: number;
  incomingQuantity: number;
  safetyStock: number;
  version: number;
  isBelowSafetyStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryListItem extends InventoryItem {
  variant: VariantSummary | null;
}

export interface ListInventoryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  warehouseId?: string;
  belowSafetyStock?: boolean;
}

export interface AdjustInventoryInput {
  variantId: string;
  warehouseId: string;
  type: InventoryMovementType;
  quantity: number;
  reason?: string;
  allowNegative?: boolean;
}

export interface ReservationReferenceInput {
  variantId: string;
  warehouseId: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  reason?: string;
}

export interface SetSafetyStockInput {
  variantId: string;
  warehouseId: string;
  safetyStock: number;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  type: InventoryMovementType;
  quantity: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string;
  createdAt: string;
}

export interface ListMovementsParams {
  page?: number;
  pageSize?: number;
  variantId?: string;
  warehouseId?: string;
  type?: InventoryMovementType;
  referenceType?: string;
  referenceId?: string;
}
