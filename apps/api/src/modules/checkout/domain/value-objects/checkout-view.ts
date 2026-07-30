import type { CartView } from '../../../cart/domain/value-objects/cart-view';
import type { CheckoutAddressProps } from '../entities/checkout-address.entity';
import type { ShippingMethodProps } from '../entities/shipping-method.entity';
import type { CheckoutStatus } from './checkout-enums';

/** Respuesta pública compuesta de un checkout: el carrito vigente (vía `BuildCartViewUseCase` de Cart) más lo propio de Checkout (direcciones, método de envío, impuesto, gran total). Igual que `CartView`, nada de esto se persiste tal cual — se recalcula en caliente hasta el momento de `POST /checkout/confirm`. */
export interface CheckoutView {
  id: string;
  cartId: string;
  customerId: string | null;
  sessionId: string;
  contactEmail: string | null;
  status: CheckoutStatus;
  cart: CartView;
  shippingAddress: CheckoutAddressProps | null;
  billingAddress: CheckoutAddressProps | null;
  shippingMethod: ShippingMethodProps | null;
  shippingCost: number;
  taxAmount: number;
  grandTotal: number;
  createdAt: Date;
  updatedAt: Date;
}
