import type { InventoryMovement as PrismaInventoryMovement } from '@prisma/client';

import { InventoryMovementEntity } from '../../domain/entities/inventory-movement.entity';
import type { InventoryMovementType } from '../../domain/value-objects/inventory-enums';

export function toMovementEntity(movement: PrismaInventoryMovement): InventoryMovementEntity {
  return new InventoryMovementEntity({
    id: movement.id,
    inventoryItemId: movement.inventoryItemId,
    type: movement.type as InventoryMovementType,
    quantity: movement.quantity,
    reason: movement.reason,
    referenceType: movement.referenceType,
    referenceId: movement.referenceId,
    createdBy: movement.createdBy,
    createdAt: movement.createdAt,
  });
}
