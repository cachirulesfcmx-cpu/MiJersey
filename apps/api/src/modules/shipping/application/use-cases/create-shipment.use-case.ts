import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { UpdateOrderStatusUseCase } from '../../../orders/application/use-cases/update-order-status.use-case';
import type { OrderRepositoryPort } from '../../../orders/domain/ports/order.repository.port';
import { ORDER_REPOSITORY } from '../../../orders/orders.constants';
import type { ShipmentEntity } from '../../domain/entities/shipment.entity';
import {
  CarrierNotFoundError,
  OrderNotFoundError,
  OrderNotPayableForShipmentError,
  ShipmentAlreadyActiveError,
} from '../../domain/errors/shipping.errors';
import type { CarrierRepositoryPort } from '../../domain/ports/carrier.repository.port';
import type { CarrierProviderPort } from '../../domain/ports/carrier-provider.port';
import type { ShipmentRepositoryPort } from '../../domain/ports/shipment.repository.port';
import type { ShipmentEventRepositoryPort } from '../../domain/ports/shipment-event.repository.port';
import { ShipmentStatus } from '../../domain/value-objects/shipment-status';
import { canTransitionShipment } from '../../domain/value-objects/shipment-transitions.util';
import {
  CARRIER_PROVIDER,
  CARRIER_REPOSITORY,
  SHIPMENT_EVENT_REPOSITORY,
  SHIPMENT_REPOSITORY,
} from '../../shipping.constants';

export interface CreateShipmentInput {
  orderId: string;
  carrierId: string;
  service: string;
  actorUserId: string;
  ipAddress: string | null;
}

/**
 * Integración con Payments (022) sin cambios estructurales en ese módulo: solo se genera un
 * envío para un pedido ya pagado (`Order.paymentStatus === 'PAID'`), leído a través de
 * `ORDER_REPOSITORY` (021) sin importar Payments. Integración con Orders (021): al crear el
 * envío se mueve `fulfillmentStatus` a `PROCESSING` vía `UpdateOrderStatusUseCase`, el mismo
 * mecanismo genérico que 022-Payments ya reutiliza — cero cambios estructurales en Orders.
 */
@Injectable()
export class CreateShipmentUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepositoryPort,
    @Inject(CARRIER_REPOSITORY) private readonly carriers: CarrierRepositoryPort,
    @Inject(SHIPMENT_REPOSITORY) private readonly shipments: ShipmentRepositoryPort,
    @Inject(SHIPMENT_EVENT_REPOSITORY) private readonly events: ShipmentEventRepositoryPort,
    @Inject(CARRIER_PROVIDER) private readonly provider: CarrierProviderPort,
    private readonly updateOrderStatus: UpdateOrderStatusUseCase,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateShipmentInput): Promise<ShipmentEntity> {
    const order = await this.orders.findById(input.orderId);
    if (!order) throw new OrderNotFoundError();
    if (order.toJSON().paymentStatus !== 'PAID') throw new OrderNotPayableForShipmentError();

    const carrier = await this.carriers.findById(input.carrierId);
    if (!carrier || !carrier.isActive) throw new CarrierNotFoundError();

    const existing = await this.shipments.findByOrderId(input.orderId);
    const hasActive = existing.some((shipment) =>
      canTransitionShipment(shipment.status as ShipmentStatus),
    );
    if (hasActive) throw new ShipmentAlreadyActiveError();

    const result = await this.provider.createShipment({
      orderId: order.id,
      carrierId: carrier.id,
    });

    const shipment = await this.shipments.create({
      orderId: order.id,
      carrierId: carrier.id,
      service: input.service,
      trackingNumber: result.trackingNumber,
      labelUrl: result.labelUrl,
    });

    await this.events.create({
      shipmentId: shipment.id,
      eventType: 'created',
      payload: { trackingNumber: result.trackingNumber },
    });

    await this.updateOrderStatus.execute({
      orderId: order.id,
      field: 'fulfillmentStatus',
      value: 'PROCESSING',
      note: `Envío generado (${carrier.toJSON().name})`,
      actorUserId: input.actorUserId,
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'shipping.shipment.created',
      ipAddress: input.ipAddress,
      metadata: { shipmentId: shipment.id, orderId: order.id, carrierId: carrier.id },
    });

    return shipment;
  }
}
