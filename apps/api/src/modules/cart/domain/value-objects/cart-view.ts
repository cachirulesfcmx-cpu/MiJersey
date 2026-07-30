import type { CartStatus, CouponType } from './cart-enums';

export interface CartItemView {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantTitle: string;
  sku: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  availableQuantity: number;
  inStock: boolean;
}

export interface CartCouponView {
  code: string;
  type: CouponType;
  value: number;
  isValid: boolean;
}

export interface CartView {
  id: string;
  customerId: string | null;
  sessionId: string;
  currency: string;
  status: CartStatus;
  items: CartItemView[];
  coupon: CartCouponView | null;
  subtotal: number;
  discount: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}
