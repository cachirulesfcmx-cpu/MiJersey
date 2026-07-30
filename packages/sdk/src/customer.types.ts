export type AddressType = 'SHIPPING' | 'BILLING';

export interface CustomerPreferences {
  marketingEmailsOptIn: boolean;
}

export interface MyAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  phone: string | null;
  preferences: CustomerPreferences;
  createdAt: string;
}

export interface UpdateMyAccountInput {
  firstName: string;
  lastName: string;
  phone?: string;
  preferences?: CustomerPreferences;
}

export interface Address {
  id: string;
  customerId: string;
  type: AddressType;
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
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressInput {
  type: AddressType;
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
  isDefault?: boolean;
}

export type UpdateAddressInput = Partial<CreateAddressInput>;

export interface CustomerOrderItem {
  id: string;
  productId: string;
  variantId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CustomerOrderSummary {
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

export interface CustomerOrderDetail extends CustomerOrderSummary {
  customerId: string | null;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  items: CustomerOrderItem[];
}
