export interface CartItemProps {
  id: string;
  cartId: string;
  productId: string;
  variantId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CartItemEntity {
  constructor(private readonly props: CartItemProps) {}

  get id(): string {
    return this.props.id;
  }

  get cartId(): string {
    return this.props.cartId;
  }

  get productId(): string {
    return this.props.productId;
  }

  get variantId(): string {
    return this.props.variantId;
  }

  get sku(): string {
    return this.props.sku;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get unitPrice(): number {
    return this.props.unitPrice;
  }

  get subtotal(): number {
    return this.props.subtotal;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): CartItemProps {
    return { ...this.props };
  }
}
