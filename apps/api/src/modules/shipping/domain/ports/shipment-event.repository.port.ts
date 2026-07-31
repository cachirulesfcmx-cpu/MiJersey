import type { ShipmentEventEntity } from '../entities/shipment-event.entity';

export interface CreateShipmentEventData {
  shipmentId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export interface ShipmentEventRepositoryPort {
  findByShipmentId(shipmentId: string): Promise<ShipmentEventEntity[]>;
  create(data: CreateShipmentEventData): Promise<ShipmentEventEntity>;
}
