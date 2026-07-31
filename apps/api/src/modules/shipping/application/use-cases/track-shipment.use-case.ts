import { Inject, Injectable } from '@nestjs/common';

import type { ShipmentEntity } from '../../domain/entities/shipment.entity';
import type { ShipmentEventEntity } from '../../domain/entities/shipment-event.entity';
import { TrackingNumberNotFoundError } from '../../domain/errors/shipping.errors';
import type { ShipmentRepositoryPort } from '../../domain/ports/shipment.repository.port';
import type { ShipmentEventRepositoryPort } from '../../domain/ports/shipment-event.repository.port';
import { SHIPMENT_EVENT_REPOSITORY, SHIPMENT_REPOSITORY } from '../../shipping.constants';

export interface TrackShipmentResult {
  shipment: ShipmentEntity;
  events: ShipmentEventEntity[];
}

/** Público, sin verificación de propiedad — el número de guía es la capacidad para consultarlo, mismo criterio que `orderId` en Payments (022): quien lo conoce ya lo recibió por un canal legítimo (confirmación de envío). */
@Injectable()
export class TrackShipmentUseCase {
  constructor(
    @Inject(SHIPMENT_REPOSITORY) private readonly shipments: ShipmentRepositoryPort,
    @Inject(SHIPMENT_EVENT_REPOSITORY) private readonly events: ShipmentEventRepositoryPort,
  ) {}

  async execute(trackingNumber: string): Promise<TrackShipmentResult> {
    const shipment = await this.shipments.findByTrackingNumber(trackingNumber);
    if (!shipment) throw new TrackingNumberNotFoundError();

    const events = await this.events.findByShipmentId(shipment.id);
    return { shipment, events };
  }
}
