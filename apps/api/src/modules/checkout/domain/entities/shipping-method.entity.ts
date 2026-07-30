export interface ShippingMethodProps {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ShippingMethodEntity {
  constructor(private readonly props: ShippingMethodProps) {}

  get id(): string {
    return this.props.id;
  }

  get basePrice(): number {
    return this.props.basePrice;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  toJSON(): ShippingMethodProps {
    return { ...this.props };
  }
}
