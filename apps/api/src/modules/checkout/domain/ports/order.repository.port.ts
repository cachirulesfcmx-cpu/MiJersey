import type { OrderEntity } from '../entities/order.entity';

export interface CreateOrderItemData {
  productId: string;
  variantId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CreateOrderData {
  orderNumber: string;
  customerId: string | null;
  contactEmail: string;
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
  items: CreateOrderItemData[];
}

export interface OrderRepositoryPort {
  findById(id: string): Promise<OrderEntity | null>;
  /** Crea la orden y sus líneas en una sola transacción — nunca debe existir una orden sin items. */
  create(data: CreateOrderData): Promise<OrderEntity>;
}
