import type { PromotionRuleOperator, PromotionRuleType } from '../value-objects/promotion-enums';

export interface PromotionRuleProps {
  id: string;
  promotionId: string;
  ruleType: PromotionRuleType;
  operator: PromotionRuleOperator;
  value: string;
  createdAt: Date;
}

export class PromotionRuleEntity {
  constructor(private readonly props: PromotionRuleProps) {}

  get ruleType(): PromotionRuleType {
    return this.props.ruleType;
  }

  get operator(): PromotionRuleOperator {
    return this.props.operator;
  }

  get value(): string {
    return this.props.value;
  }

  toJSON(): PromotionRuleProps {
    return { ...this.props };
  }
}
