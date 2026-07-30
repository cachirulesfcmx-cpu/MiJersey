import type { CartStatus } from '../value-objects/cart-enums';
import type { CartItemEntity } from './cart-item.entity';

export interface CartProps {
  id: string;
  customerId: string | null;
  sessionId: string;
  currency: string;
  status: CartStatus;
  couponCode: string | null;
  items: CartItemEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export class CartEntity {
  constructor(private readonly props: CartProps) {}

  get id(): string {
    return this.props.id;
  }

  get customerId(): string | null {
    return this.props.customerId;
  }

  get sessionId(): string {
    return this.props.sessionId;
  }

  get currency(): string {
    return this.props.currency;
  }

  get status(): CartStatus {
    return this.props.status;
  }

  get couponCode(): string | null {
    return this.props.couponCode;
  }

  get items(): CartItemEntity[] {
    return this.props.items;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get subtotal(): number {
    return this.props.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  toJSON(): Omit<CartProps, 'items'> & { items: ReturnType<CartItemEntity['toJSON']>[] } {
    return { ...this.props, items: this.props.items.map((item) => item.toJSON()) };
  }
}
