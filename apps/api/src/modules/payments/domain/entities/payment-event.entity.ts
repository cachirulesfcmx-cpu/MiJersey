export interface PaymentEventProps {
  id: string;
  paymentId: string;
  eventType: string;
  payload: Record<string, unknown>;
  processedAt: Date;
}

export class PaymentEventEntity {
  constructor(private readonly props: PaymentEventProps) {}

  get id(): string {
    return this.props.id;
  }

  toJSON(): PaymentEventProps {
    return { ...this.props };
  }
}
