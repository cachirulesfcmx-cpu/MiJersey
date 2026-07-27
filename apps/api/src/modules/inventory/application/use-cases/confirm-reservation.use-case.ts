import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { InventoryItemEntity } from '../../domain/entities/inventory-item.entity';
import {
  InvalidReleaseQuantityError,
  InventoryItemNotFoundError,
  VariantNotFoundError,
} from '../../domain/errors/inventory.errors';
import type { InventoryItemRepositoryPort } from '../../domain/ports/inventory-item.repository.port';
import type { VariantQueryPort } from '../../domain/ports/variant-query.port';
import { InventoryMovementType } from '../../domain/value-objects/inventory-enums';
import {
  INVENTORY_ITEM_REPOSITORY,
  MAX_CONCURRENCY_RETRIES,
  VARIANT_QUERY,
} from '../../inventory.constants';
import { applyMovementWithRetry } from './apply-movement-with-retry.util';

export interface ConfirmReservationInput {
  variantId: string;
  warehouseId: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  reason?: string;
  actorUserId: string;
  ipAddress: string | null;
}

/**
 * Confirma una reserva existente como salida definitiva (spec §5: "Confirmaciones
 * de pedido convertirán reservas en salidas"). Solo reduce `reservedQuantity` —
 * `availableQuantity` ya se descontó al reservar, así que no vuelve a tocarse.
 * Primitiva genérica (referenceType/referenceId) para que 021-Orders la use sin
 * cambios estructurales, tal como pide la Definition of Done del spec.
 */
@Injectable()
export class ConfirmReservationUseCase {
  constructor(
    @Inject(INVENTORY_ITEM_REPOSITORY) private readonly items: InventoryItemRepositoryPort,
    @Inject(VARIANT_QUERY) private readonly variantQuery: VariantQueryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: ConfirmReservationInput): Promise<InventoryItemEntity> {
    if (!(await this.variantQuery.exists(input.variantId))) {
      throw new VariantNotFoundError();
    }

    const result = await applyMovementWithRetry(async () => {
      const item = await this.items.findByVariantAndWarehouse(input.variantId, input.warehouseId);
      if (!item) {
        throw new InventoryItemNotFoundError();
      }

      if (item.reservedQuantity - input.quantity < 0) {
        throw new InvalidReleaseQuantityError();
      }

      return this.items.applyMovement({
        itemId: item.id,
        version: item.version,
        delta: { reservedDelta: -input.quantity },
        movement: {
          type: InventoryMovementType.OUTBOUND,
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
      action: 'inventory.stock.reservation_confirmed',
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
