import type { FulfillmentStatus, OrderStatus, PaymentStatus } from '../value-objects/order-enums';
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
  cancelledAt: Date | null;
  cancelReason: string | null;
  items: OrderItemEntity[];
  createdAt: Date;
  updatedAt: Date;
}

/** Dueño definitivo de `orders`/`order_items` (018-Checkout solo alojaba el modelo mínimo mientras 021 no existía — ver comentario en `schema.prisma`). Checkout sigue escribiendo estas tablas al confirmar (`ConfirmCheckoutUseCase`, sin cambios); Orders construye su propia lectura/escritura encima, mismo patrón CQRS que Customer (019) ya aplicaba. */
export class OrderEntity {
  constructor(private readonly props: OrderProps) {}

  get id(): string {
    return this.props.id;
  }

  get customerId(): string | null {
    return this.props.customerId;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get fulfillmentStatus(): FulfillmentStatus {
    return this.props.fulfillmentStatus;
  }

  get items(): OrderItemEntity[] {
    return this.props.items;
  }

  toJSON(): Omit<OrderProps, 'items'> & { items: ReturnType<OrderItemEntity['toJSON']>[] } {
    return { ...this.props, items: this.props.items.map((item) => item.toJSON()) };
  }
}
