import type {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
} from '../value-objects/checkout-enums';
import type { OrderItemEntity } from './order-item.entity';

export interface OrderProps {
  id: string;
  orderNumber: string;
  customerId: string | null;
  contactEmail: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  currency: string;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  couponCode: string | null;
  shippingAddressId: string | null;
  billingAddressId: string | null;
  shippingMethodId: string | null;
  items: OrderItemEntity[];
  createdAt: Date;
  updatedAt: Date;
}

/** Modelo mínimo de 021-Orders — ver comentario en `schema.prisma` sobre por qué se creó ahora, desde Checkout (018). */
export class OrderEntity {
  constructor(private readonly props: OrderProps) {}

  get id(): string {
    return this.props.id;
  }

  get orderNumber(): string {
    return this.props.orderNumber;
  }

  toJSON(): Omit<OrderProps, 'items'> & { items: ReturnType<OrderItemEntity['toJSON']>[] } {
    return { ...this.props, items: this.props.items.map((item) => item.toJSON()) };
  }
}
