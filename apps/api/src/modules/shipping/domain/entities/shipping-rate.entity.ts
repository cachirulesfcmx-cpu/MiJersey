export interface ShippingRateProps {
  id: string;
  carrierId: string;
  zoneId: string;
  name: string;
  basePrice: number;
  pricePerKg: number;
  freeShippingThreshold: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ShippingRateEntity {
  constructor(private readonly props: ShippingRateProps) {}

  get id(): string {
    return this.props.id;
  }

  get carrierId(): string {
    return this.props.carrierId;
  }

  get zoneId(): string {
    return this.props.zoneId;
  }

  get basePrice(): number {
    return this.props.basePrice;
  }

  get pricePerKg(): number {
    return this.props.pricePerKg;
  }

  get freeShippingThreshold(): number | null {
    return this.props.freeShippingThreshold;
  }

  get estimatedDaysMin(): number {
    return this.props.estimatedDaysMin;
  }

  get estimatedDaysMax(): number {
    return this.props.estimatedDaysMax;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  toJSON(): ShippingRateProps {
    return { ...this.props };
  }
}
