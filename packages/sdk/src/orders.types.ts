import type { Cart } from './cart.types.js';

export type { Order, OrderItem } from './checkout.types.js';

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  currency: string;
  grandTotal: number;
  itemCount: number;
  createdAt: string;
}

export interface OrderTimelineEvent {
  field: string;
  value: string;
  note: string | null;
  occurredAt: string;
}

export interface CancelOrderInput {
  reason?: string;
}

export interface ReorderResult {
  cart: Cart;
  succeededCount: number;
  failedCount: number;
}
