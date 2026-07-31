export interface OrderStatusHistoryProps {
  id: string;
  orderId: string;
  field: string;
  value: string;
  note: string | null;
  createdAt: Date;
}

export class OrderStatusHistoryEntity {
  constructor(private readonly props: OrderStatusHistoryProps) {}

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): OrderStatusHistoryProps {
    return { ...this.props };
  }
}
