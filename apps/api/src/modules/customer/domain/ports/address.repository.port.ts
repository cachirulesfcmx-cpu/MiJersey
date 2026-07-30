import type { AddressEntity } from '../entities/address.entity';
import type { AddressType } from '../value-objects/address-enums';

export interface CreateAddressData {
  customerId: string;
  type: AddressType;
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
  isDefault?: boolean;
}

export interface UpdateAddressData {
  type?: AddressType;
  firstName?: string;
  lastName?: string;
  company?: string | null;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string | null;
  isDefault?: boolean;
}

export interface AddressRepositoryPort {
  findById(id: string): Promise<AddressEntity | null>;
  findByCustomerId(customerId: string): Promise<AddressEntity[]>;
  findDefaultByType(customerId: string, type: AddressType): Promise<AddressEntity | null>;
  create(data: CreateAddressData): Promise<AddressEntity>;
  update(id: string, data: UpdateAddressData): Promise<AddressEntity>;
  unsetDefault(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
