import type {
  PromotionDiscountType,
  PromotionStatus,
  PromotionType,
} from '../value-objects/promotion-enums';
import type { PromotionRuleEntity } from './promotion-rule.entity';

export interface PromotionProps {
  id: string;
  name: string;
  code: string | null;
  type: PromotionType;
  discountType: PromotionDiscountType;
  discountValue: number;
  status: PromotionStatus;
  priority: number;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
  stackable: boolean;
  rules: PromotionRuleEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export class PromotionEntity {
  constructor(private readonly props: PromotionProps) {}

  get id(): string {
    return this.props.id;
  }

  get code(): string | null {
    return this.props.code;
  }

  get type(): PromotionType {
    return this.props.type;
  }

  get discountType(): PromotionDiscountType {
    return this.props.discountType;
  }

  get discountValue(): number {
    return this.props.discountValue;
  }

  get status(): PromotionStatus {
    return this.props.status;
  }

  get priority(): number {
    return this.props.priority;
  }

  get startsAt(): Date | null {
    return this.props.startsAt;
  }

  get endsAt(): Date | null {
    return this.props.endsAt;
  }

  get usageLimit(): number | null {
    return this.props.usageLimit;
  }

  get usageCount(): number {
    return this.props.usageCount;
  }

  get stackable(): boolean {
    return this.props.stackable;
  }

  get rules(): PromotionRuleEntity[] {
    return this.props.rules;
  }

  /** Un `MANUAL_COUPON` sin reglas se puede replicar 1:1 en `Coupon` (017) — cualquier regla exige el motor de 024, que Cart no puede evaluar. */
  get isMirrorableToCart(): boolean {
    return this.props.type === 'MANUAL_COUPON' && this.props.rules.length === 0;
  }

  /** Descuento sobre `subtotal`, nunca negativo ni mayor al propio subtotal — mismo criterio que `CouponEntity.computeDiscount` (017). */
  calculateDiscount(subtotal: number): number {
    const raw =
      this.props.discountType === 'PERCENTAGE'
        ? subtotal * (this.props.discountValue / 100)
        : this.props.discountValue;
    return Math.min(Math.max(raw, 0), subtotal);
  }

  toJSON(): Omit<PromotionProps, 'rules'> & { rules: ReturnType<PromotionRuleEntity['toJSON']>[] } {
    return { ...this.props, rules: this.props.rules.map((rule) => rule.toJSON()) };
  }
}
