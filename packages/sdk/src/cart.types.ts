export type CartStatus = 'ACTIVE' | 'MERGED' | 'ABANDONED' | 'CONVERTED';
export type CouponType = 'PERCENTAGE' | 'FIXED';

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

export interface Cart {
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
  createdAt: string;
  updatedAt: string;
}

export interface AddCartItemInput {
  variantId: string;
  quantity: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponInput {
  code: string;
  type: CouponType;
  value: number;
  isActive?: boolean;
  expiresAt?: string | null;
}

export interface UpdateCouponInput {
  type?: CouponType;
  value?: number;
  isActive?: boolean;
  expiresAt?: string | null;
}
