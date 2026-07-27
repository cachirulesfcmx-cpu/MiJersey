import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { InventoryItemEntity } from '../../domain/entities/inventory-item.entity';
import {
  InventoryItemNotFoundError,
  VariantNotFoundError,
} from '../../domain/errors/inventory.errors';
import type { InventoryItemRepositoryPort } from '../../domain/ports/inventory-item.repository.port';
import type { VariantQueryPort } from '../../domain/ports/variant-query.port';
import { INVENTORY_ITEM_REPOSITORY, VARIANT_QUERY } from '../../inventory.constants';

export interface SetSafetyStockInput {
  variantId: string;
  warehouseId: string;
  safetyStock: number;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class SetSafetyStockUseCase {
  constructor(
    @Inject(INVENTORY_ITEM_REPOSITORY) private readonly items: InventoryItemRepositoryPort,
    @Inject(VARIANT_QUERY) private readonly variantQuery: VariantQueryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: SetSafetyStockInput): Promise<InventoryItemEntity> {
    if (!(await this.variantQuery.exists(input.variantId))) {
      throw new VariantNotFoundError();
    }

    const item = await this.items.findByVariantAndWarehouse(input.variantId, input.warehouseId);
    if (!item) {
      throw new InventoryItemNotFoundError();
    }

    const updated = await this.items.updateSafetyStock(item.id, input.safetyStock);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'inventory.item.safety_stock_updated',
      ipAddress: input.ipAddress,
      metadata: {
        variantId: input.variantId,
        warehouseId: input.warehouseId,
        safetyStock: input.safetyStock,
      },
    });

    return updated;
  }
}
