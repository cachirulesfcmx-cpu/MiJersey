import { CouponType } from '../value-objects/cart-enums';

export interface CouponProps {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  isActive: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CouponEntity {
  constructor(private readonly props: CouponProps) {}

  get id(): string {
    return this.props.id;
  }

  get code(): string {
    return this.props.code;
  }

  get type(): CouponType {
    return this.props.type;
  }

  get value(): number {
    return this.props.value;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isExpired(): boolean {
    return this.props.expiresAt !== null && this.props.expiresAt.getTime() < Date.now();
  }

  /** Descuento aplicado sobre `subtotal` vigente — nunca negativo ni mayor al propio subtotal. */
  computeDiscount(subtotal: number): number {
    const raw =
      this.props.type === 'PERCENTAGE' ? subtotal * (this.props.value / 100) : this.props.value;
    return Math.min(Math.max(raw, 0), subtotal);
  }

  toJSON(): CouponProps {
    return { ...this.props };
  }
}
