export type PromotionType = 'MANUAL_COUPON' | 'AUTOMATIC';
export type PromotionDiscountType = 'PERCENTAGE' | 'FIXED';
export type PromotionStatus = 'ACTIVE' | 'INACTIVE';
export type PromotionRuleType = 'MIN_CART_AMOUNT' | 'PRODUCT' | 'CATEGORY' | 'BRAND' | 'CUSTOMER';
export type PromotionRuleOperator = 'GTE' | 'IN';

export interface PromotionRule {
  id: string;
  promotionId: string;
  ruleType: PromotionRuleType;
  operator: PromotionRuleOperator;
  value: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  name: string;
  code: string | null;
  type: PromotionType;
  discountType: PromotionDiscountType;
  discountValue: number;
  status: PromotionStatus;
  priority: number;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  stackable: boolean;
  rules: PromotionRule[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionRuleInput {
  ruleType: PromotionRuleType;
  operator: PromotionRuleOperator;
  value: string;
}

export interface CreatePromotionInput {
  name: string;
  code?: string;
  type: PromotionType;
  discountType: PromotionDiscountType;
  discountValue: number;
  status?: PromotionStatus;
  priority?: number;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  stackable?: boolean;
  rules?: CreatePromotionRuleInput[];
}

export interface UpdatePromotionInput {
  name?: string;
  code?: string;
  discountType?: PromotionDiscountType;
  discountValue?: number;
  status?: PromotionStatus;
  priority?: number;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  stackable?: boolean;
  rules?: CreatePromotionRuleInput[];
}

export interface ValidatePromotionResult {
  applicable: Promotion[];
  discountTotal: number;
  currency: string;
}

export interface RecordedPromotionUsage {
  id: string;
  promotionId: string;
  orderId: string;
  customerId: string | null;
  discountAmount: number;
  createdAt: string;
}

export interface PromotionUsageSummary {
  id: string;
  promotionId: string;
  promotionName: string;
  promotionCode: string | null;
  orderId: string;
  customerId: string | null;
  discountAmount: number;
  createdAt: string;
}
