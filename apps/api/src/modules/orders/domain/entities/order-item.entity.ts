export interface OrderItemProps {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export class OrderItemEntity {
  constructor(private readonly props: OrderItemProps) {}

  get variantId(): string {
    return this.props.variantId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  toJSON(): OrderItemProps {
    return { ...this.props };
  }
}
