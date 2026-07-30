export interface CustomerPreferences {
  marketingEmailsOptIn: boolean;
}

export interface CustomerProfileProps {
  id: string;
  userId: string;
  phone: string | null;
  preferences: CustomerPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerProfileEntity {
  constructor(private readonly props: CustomerProfileProps) {}

  get phone(): string | null {
    return this.props.phone;
  }

  get preferences(): CustomerPreferences {
    return this.props.preferences;
  }

  toJSON(): CustomerProfileProps {
    return { ...this.props };
  }
}
