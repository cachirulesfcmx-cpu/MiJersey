import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { InventoryItemEntity } from '../../domain/entities/inventory-item.entity';
import {
  InsufficientStockError,
  InventoryItemNotFoundError,
  VariantNotFoundError,
  WarehouseNotActiveError,
  WarehouseNotFoundError,
} from '../../domain/errors/inventory.errors';
import type { InventoryItemRepositoryPort } from '../../domain/ports/inventory-item.repository.port';
import type { VariantQueryPort } from '../../domain/ports/variant-query.port';
import type { WarehouseRepositoryPort } from '../../domain/ports/warehouse.repository.port';
import { InventoryMovementType, WarehouseStatus } from '../../domain/value-objects/inventory-enums';
import {
  INVENTORY_ITEM_REPOSITORY,
  MAX_CONCURRENCY_RETRIES,
  VARIANT_QUERY,
  WAREHOUSE_REPOSITORY,
} from '../../inventory.constants';
import { applyMovementWithRetry } from './apply-movement-with-retry.util';

export interface ReserveStockInput {
  variantId: string;
  warehouseId: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  reason?: string;
  actorUserId: string;
  ipAddress: string | null;
}

/** Reserva (spec §4/§5): reduce `availableQuantity`, aumenta `reservedQuantity`. Nunca permite quedar negativo. */
@Injectable()
export class ReserveStockUseCase {
  constructor(
    @Inject(INVENTORY_ITEM_REPOSITORY) private readonly items: InventoryItemRepositoryPort,
    @Inject(WAREHOUSE_REPOSITORY) private readonly warehouses: WarehouseRepositoryPort,
    @Inject(VARIANT_QUERY) private readonly variantQuery: VariantQueryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: ReserveStockInput): Promise<InventoryItemEntity> {
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

    const result = await applyMovementWithRetry(async () => {
      const item = await this.items.findByVariantAndWarehouse(input.variantId, input.warehouseId);
      if (!item) {
        throw new InventoryItemNotFoundError();
      }

      if (item.availableQuantity - input.quantity < 0) {
        throw new InsufficientStockError();
      }

      return this.items.applyMovement({
        itemId: item.id,
        version: item.version,
        delta: { availableDelta: -input.quantity, reservedDelta: input.quantity },
        movement: {
          type: InventoryMovementType.RESERVATION,
          quantity: input.quantity,
          reason: input.reason?.trim() || null,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          createdBy: input.actorUserId,
        },
      });
    }, MAX_CONCURRENCY_RETRIES);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'inventory.stock.reserved',
      ipAddress: input.ipAddress,
      metadata: {
        variantId: input.variantId,
        warehouseId: input.warehouseId,
        quantity: input.quantity,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
      },
    });

    return result.item;
  }
}
