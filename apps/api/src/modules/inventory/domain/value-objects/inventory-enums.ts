export enum WarehouseStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum InventoryMovementType {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
  RESERVATION = 'RESERVATION',
  RELEASE = 'RELEASE',
  ADJUSTMENT_POSITIVE = 'ADJUSTMENT_POSITIVE',
  ADJUSTMENT_NEGATIVE = 'ADJUSTMENT_NEGATIVE',
  RETURN = 'RETURN',
}

/** Tipos permitidos en el ajuste manual (`POST /admin/inventory/adjust`) — reserva/liberación tienen sus propios endpoints. */
export const MANUAL_ADJUSTMENT_TYPES = new Set<InventoryMovementType>([
  InventoryMovementType.INBOUND,
  InventoryMovementType.OUTBOUND,
  InventoryMovementType.ADJUSTMENT_POSITIVE,
  InventoryMovementType.ADJUSTMENT_NEGATIVE,
  InventoryMovementType.RETURN,
]);

/** Tipos que incrementan `availableQuantity` en un ajuste manual. */
export const INCREASING_TYPES = new Set<InventoryMovementType>([
  InventoryMovementType.INBOUND,
  InventoryMovementType.ADJUSTMENT_POSITIVE,
  InventoryMovementType.RETURN,
]);
