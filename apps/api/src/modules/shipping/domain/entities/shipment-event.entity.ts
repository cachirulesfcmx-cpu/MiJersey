export interface ShipmentEventProps {
  id: string;
  shipmentId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export class ShipmentEventEntity {
  constructor(private readonly props: ShipmentEventProps) {}

  get id(): string {
    return this.props.id;
  }

  toJSON(): ShipmentEventProps {
    return { ...this.props };
  }
}
