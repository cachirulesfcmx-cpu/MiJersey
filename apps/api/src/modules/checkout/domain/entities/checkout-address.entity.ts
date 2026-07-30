export interface CheckoutAddressProps {
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
  createdAt: Date;
}

export class CheckoutAddressEntity {
  constructor(private readonly props: CheckoutAddressProps) {}

  get id(): string {
    return this.props.id;
  }

  toJSON(): CheckoutAddressProps {
    return { ...this.props };
  }
}
