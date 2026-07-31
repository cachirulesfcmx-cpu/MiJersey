import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { UpdateOrderStatusUseCase } from '../../../orders/application/use-cases/update-order-status.use-case';
import type { ShipmentEntity } from '../../domain/entities/shipment.entity';
import {
  ShipmentNotFoundError,
  ShipmentNotUpdatableError,
} from '../../domain/errors/shipping.errors';
import type { ShipmentRepositoryPort } from '../../domain/ports/shipment.repository.port';
import type { ShipmentEventRepositoryPort } from '../../domain/ports/shipment-event.repository.port';
import { ShipmentStatus } from '../../domain/value-objects/shipment-status';
import { canTransitionShipment } from '../../domain/value-objects/shipment-transitions.util';
import { SHIPMENT_EVENT_REPOSITORY, SHIPMENT_REPOSITORY } from '../../shipping.constants';

export interface UpdateShipmentStatusInput {
  id: string;
  status: ShipmentStatus;
  note?: string;
  actorUserId: string;
  ipAddress: string | null;
}

/** Solo `IN_TRANSIT`→`SHIPPED` y `DELIVERED`→`DELIVERED` tienen equivalente en `FulfillmentStatus` (021); `FAILED`/`RETURNED` quedan registrados en la línea de tiempo del envío sin mover el pedido — ese enum (fijado en 021) no modela incidencias de transporte, simplificación documentada igual que el reembolso parcial de 022-Payments. */
const ORDER_FULFILLMENT_BY_SHIPMENT_STATUS: Partial<Record<ShipmentStatus, string>> = {
  [ShipmentStatus.IN_TRANSIT]: 'SHIPPED',
  [ShipmentStatus.DELIVERED]: 'DELIVERED',
};

@Injectable()
export class UpdateShipmentStatusUseCase {
  constructor(
    @Inject(SHIPMENT_REPOSITORY) private readonly shipments: ShipmentRepositoryPort,
    @Inject(SHIPMENT_EVENT_REPOSITORY) private readonly events: ShipmentEventRepositoryPort,
    private readonly updateOrderStatus: UpdateOrderStatusUseCase,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateShipmentStatusInput): Promise<ShipmentEntity> {
    const existing = await this.shipments.findById(input.id);
    if (!existing) throw new ShipmentNotFoundError();
    if (!canTransitionShipment(existing.status as ShipmentStatus)) {
      throw new ShipmentNotUpdatableError();
    }

    const now = new Date();
    const updated = await this.shipments.updateStatus(input.id, {
      status: input.status,
      ...(input.status === ShipmentStatus.IN_TRANSIT ? { shippedAt: now } : {}),
      ...(input.status === ShipmentStatus.DELIVERED ? { deliveredAt: now } : {}),
    });

    await this.events.create({
      shipmentId: input.id,
      eventType: 'status_changed',
      payload: { from: existing.status, to: input.status, note: input.note ?? null },
    });

    const fulfillmentStatus = ORDER_FULFILLMENT_BY_SHIPMENT_STATUS[input.status];
    if (fulfillmentStatus) {
      await this.updateOrderStatus.execute({
        orderId: existing.orderId,
        field: 'fulfillmentStatus',
        value: fulfillmentStatus,
        note: input.note ?? `Envío actualizado a ${input.status}`,
        actorUserId: input.actorUserId,
      });
    }

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'shipping.shipment.status_changed',
      ipAddress: input.ipAddress,
      metadata: { shipmentId: input.id, from: existing.status, to: input.status },
    });

    return updated;
  }
}
