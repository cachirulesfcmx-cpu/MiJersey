import type { CheckoutStatus } from '../value-objects/checkout-enums';

export interface CheckoutSessionProps {
  id: string;
  cartId: string;
  customerId: string | null;
  sessionId: string;
  contactEmail: string | null;
  shippingAddressId: string | null;
  billingAddressId: string | null;
  shippingMethodId: string | null;
  status: CheckoutStatus;
  orderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CheckoutSessionEntity {
  constructor(private readonly props: CheckoutSessionProps) {}

  get id(): string {
    return this.props.id;
  }

  get cartId(): string {
    return this.props.cartId;
  }

  get customerId(): string | null {
    return this.props.customerId;
  }

  get sessionId(): string {
    return this.props.sessionId;
  }

  get contactEmail(): string | null {
    return this.props.contactEmail;
  }

  get shippingAddressId(): string | null {
    return this.props.shippingAddressId;
  }

  get billingAddressId(): string | null {
    return this.props.billingAddressId;
  }

  get shippingMethodId(): string | null {
    return this.props.shippingMethodId;
  }

  get status(): CheckoutStatus {
    return this.props.status;
  }

  get orderId(): string | null {
    return this.props.orderId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): CheckoutSessionProps {
    return { ...this.props };
  }
}
