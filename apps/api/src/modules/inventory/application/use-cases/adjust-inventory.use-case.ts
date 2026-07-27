import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { InventoryItemEntity } from '../../domain/entities/inventory-item.entity';
import {
  InsufficientStockError,
  InvalidMovementTypeError,
  VariantNotFoundError,
  WarehouseNotActiveError,
  WarehouseNotFoundError,
} from '../../domain/errors/inventory.errors';
import type { InventoryItemRepositoryPort } from '../../domain/ports/inventory-item.repository.port';
import type { VariantQueryPort } from '../../domain/ports/variant-query.port';
import type { WarehouseRepositoryPort } from '../../domain/ports/warehouse.repository.port';
import {
  INCREASING_TYPES,
  InventoryMovementType,
  MANUAL_ADJUSTMENT_TYPES,
  WarehouseStatus,
} from '../../domain/value-objects/inventory-enums';
import {
  INVENTORY_ITEM_REPOSITORY,
  MAX_CONCURRENCY_RETRIES,
  VARIANT_QUERY,
  WAREHOUSE_REPOSITORY,
} from '../../inventory.constants';
import { applyMovementWithRetry } from './apply-movement-with-retry.util';

export interface AdjustInventoryInput {
  variantId: string;
  warehouseId: string;
  type: InventoryMovementType;
  quantity: number;
  reason?: string;
  allowNegative?: boolean;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class AdjustInventoryUseCase {
  constructor(
    @Inject(INVENTORY_ITEM_REPOSITORY) private readonly items: InventoryItemRepositoryPort,
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouses: WarehouseRepositoryPort,
    @Inject(VARIANT_QUERY) private readonly variantQuery: VariantQueryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: AdjustInventoryInput): Promise<InventoryItemEntity> {
    if (!MANUAL_ADJUSTMENT_TYPES.has(input.type)) {
      throw new InvalidMovementTypeError();
    }

    if (!(await this.variantQuery.exists(input.variantId))) {
      throw new VariantNotFoundError();
    }

    const warehouse = await this.warehouses.findById(input.warehouseId);
    if (!warehouse) {
      throw new WarehouseNotFoundError();
    }
    if (warehouse.status !== WarehouseStatus.ACTIVE) {
      throw new WarehouseNotActiveError();
    }

    const isIncreasing = INCREASING_TYPES.has(input.type);

    const result = await applyMovementWithRetry(async () => {
      const item = await this.items.findOrCreate(input.variantId, input.warehouseId);
      const availableDelta = isIncreasing ? input.quantity : -input.quantity;

      if (!isIncreasing && !input.allowNegative && item.availableQuantity + availableDelta < 0) {
        throw new InsufficientStockError();
      }

      return this.items.applyMovement({
        itemId: item.id,
        version: item.version,
        delta: { availableDelta },
        movement: {
          type: input.type,
          quantity: input.quantity,
          reason: input.reason?.trim() || null,
          referenceType: null,
          referenceId: null,
          createdBy: input.actorUserId,
        },
      });
    }, MAX_CONCURRENCY_RETRIES);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'inventory.item.adjusted',
      ipAddress: input.ipAddress,
      metadata: {
        variantId: input.variantId,
        warehouseId: input.warehouseId,
        type: input.type,
        quantity: input.quantity,
      },
    });

    return result.item;
  }
}
