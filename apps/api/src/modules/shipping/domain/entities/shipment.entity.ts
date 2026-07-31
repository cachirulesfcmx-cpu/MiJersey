export interface ShipmentProps {
  id: string;
  orderId: string;
  carrierId: string;
  service: string;
  trackingNumber: string | null;
  labelUrl: string | null;
  status: string;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ShipmentEntity {
  constructor(private readonly props: ShipmentProps) {}

  get id(): string {
    return this.props.id;
  }

  get orderId(): string {
    return this.props.orderId;
  }

  get carrierId(): string {
    return this.props.carrierId;
  }

  get status(): string {
    return this.props.status;
  }

  get trackingNumber(): string | null {
    return this.props.trackingNumber;
  }

  toJSON(): ShipmentProps {
    return { ...this.props };
  }
}
