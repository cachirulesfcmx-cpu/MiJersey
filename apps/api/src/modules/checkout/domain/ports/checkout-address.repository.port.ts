import type { CheckoutAddressEntity } from '../entities/checkout-address.entity';

export interface CreateCheckoutAddressData {
  firstName: string;
  lastName: string;
  company?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string | null;
}

export interface CheckoutAddressRepositoryPort {
  findById(id: string): Promise<CheckoutAddressEntity | null>;
  findByIds(ids: string[]): Promise<Map<string, CheckoutAddressEntity>>;
  create(data: CreateCheckoutAddressData): Promise<CheckoutAddressEntity>;
}
