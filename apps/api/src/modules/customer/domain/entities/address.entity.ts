import type { AddressType } from '../value-objects/address-enums';

export interface AddressProps {
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
  createdAt: Date;
  updatedAt: Date;
}

export class AddressEntity {
  constructor(private readonly props: AddressProps) {}

  get id(): string {
    return this.props.id;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get type(): AddressType {
    return this.props.type;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  toJSON(): AddressProps {
    return { ...this.props };
  }
}
