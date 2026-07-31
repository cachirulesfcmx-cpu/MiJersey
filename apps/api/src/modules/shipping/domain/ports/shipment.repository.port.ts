import type { ShipmentEntity } from '../entities/shipment.entity';

export interface CreateShipmentData {
  orderId: string;
  carrierId: string;
  service: string;
  trackingNumber: string | null;
  labelUrl: string | null;
}

export interface UpdateShipmentStatusData {
  status: string;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
}

export interface ShipmentRepositoryPort {
  findById(id: string): Promise<ShipmentEntity | null>;
  findByOrderId(orderId: string): Promise<ShipmentEntity[]>;
  findByTrackingNumber(trackingNumber: string): Promise<ShipmentEntity | null>;
  create(data: CreateShipmentData): Promise<ShipmentEntity>;
  updateStatus(id: string, data: UpdateShipmentStatusData): Promise<ShipmentEntity>;
}
