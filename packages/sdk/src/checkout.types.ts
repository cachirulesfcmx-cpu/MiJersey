import type { Cart } from './cart.types.js';

export type CheckoutStatus = 'STARTED' | 'CONFIRMED' | 'ABANDONED';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type FulfillmentStatus = 'UNFULFILLED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';

export interface CheckoutAddress {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string | null;
  createdAt: string;
}

export interface CheckoutAddressInput {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface SetCheckoutAddressInput {
  contactEmail: string;
  shipping: CheckoutAddressInput;
  /** Si se omite, se factura a la misma dirección de envío. */
  billing?: CheckoutAddressInput;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShippingMethodInput {
  name: string;
  description?: string;
  basePrice: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive?: boolean;
}

export interface UpdateShippingMethodInput {
  name?: string;
  description?: string;
  basePrice?: number;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  isActive?: boolean;
}

export interface Checkout {
  id: string;
  cartId: string;
  customerId: string | null;
  sessionId: string;
  contactEmail: string | null;
  status: CheckoutStatus;
  cart: Cart;
  shippingAddress: CheckoutAddress | null;
  billingAddress: CheckoutAddress | null;
  shippingMethod: ShippingMethod | null;
  shippingCost: number;
  taxAmount: number;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
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
  cancelledAt: string | null;
  cancelReason: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}
