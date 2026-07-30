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

  get productId(): string {
    return this.props.productId;
  }

  get variantId(): string {
    return this.props.variantId;
  }

  toJSON(): OrderItemProps {
    return { ...this.props };
  }
}
