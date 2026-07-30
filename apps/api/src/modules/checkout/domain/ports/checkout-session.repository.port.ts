import type { CheckoutSessionEntity } from '../entities/checkout-session.entity';
import type { CheckoutStatus } from '../value-objects/checkout-enums';

export interface CreateCheckoutSessionData {
  cartId: string;
  customerId: string | null;
  sessionId: string;
}

export interface UpdateCheckoutSessionData {
  contactEmail?: string;
  shippingAddressId?: string;
  billingAddressId?: string;
  shippingMethodId?: string;
  status?: CheckoutStatus;
  orderId?: string;
}

export interface CheckoutSessionRepositoryPort {
  findById(id: string): Promise<CheckoutSessionEntity | null>;
  findByCartId(cartId: string): Promise<CheckoutSessionEntity | null>;
  create(data: CreateCheckoutSessionData): Promise<CheckoutSessionEntity>;
  update(id: string, data: UpdateCheckoutSessionData): Promise<CheckoutSessionEntity>;
}
