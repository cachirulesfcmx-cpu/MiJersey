import { PromotionEntity } from '../entities/promotion.entity';
import { PromotionRuleEntity } from '../entities/promotion-rule.entity';
import {
  calculateTotalDiscount,
  type EligibilityContext,
  evaluateRule,
  isPromotionCurrentlyValid,
  isPromotionEligible,
  selectApplicablePromotions,
} from './promotion-eligibility.util';

function buildRule(overrides: Partial<{ ruleType: string; operator: string; value: string }> = {}) {
  return new PromotionRuleEntity({
    id: 'rule-1',
    promotionId: 'promo-1',
    ruleType: (overrides.ruleType ?? 'MIN_CART_AMOUNT') as never,
    operator: (overrides.operator ?? 'GTE') as never,
    value: overrides.value ?? '500',
    createdAt: new Date(),
  });
}

function buildPromotion(
  overrides: Partial<{
    status: string;
    startsAt: Date | null;
    endsAt: Date | null;
    usageLimit: number | null;
    usageCount: number;
    priority: number;
    stackable: boolean;
    rules: PromotionRuleEntity[];
    discountType: string;
    discountValue: number;
    type: string;
  }> = {},
): PromotionEntity {
  return new PromotionEntity({
    id: overrides.priority !== undefined ? `promo-${overrides.priority}` : 'promo-1',
    name: 'Test',
    code: 'TEST10',
    type: (overrides.type ?? 'MANUAL_COUPON') as never,
    discountType: (overrides.discountType ?? 'PERCENTAGE') as never,
    discountValue: overrides.discountValue ?? 10,
    status: (overrides.status ?? 'ACTIVE') as never,
    priority: overrides.priority ?? 0,
    startsAt: overrides.startsAt ?? null,
    endsAt: overrides.endsAt ?? null,
    usageLimit: overrides.usageLimit ?? null,
    usageCount: overrides.usageCount ?? 0,
    stackable: overrides.stackable ?? false,
    rules: overrides.rules ?? [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildContext(overrides: Partial<EligibilityContext> = {}): EligibilityContext {
  return {
    now: new Date('2026-01-01T00:00:00Z'),
    subtotal: 1000,
    customerId: null,
    productIds: [],
    categoryIds: [],
    brandIds: [],
    ...overrides,
  };
}

describe('evaluateRule', () => {
  it('MIN_CART_AMOUNT + GTE passes when subtotal meets the threshold', () => {
    const rule = buildRule({ ruleType: 'MIN_CART_AMOUNT', operator: 'GTE', value: '500' });
    expect(evaluateRule(rule, buildContext({ subtotal: 500 }))).toBe(true);
    expect(evaluateRule(rule, buildContext({ subtotal: 499.99 }))).toBe(false);
  });

  it('PRODUCT + IN passes when any cart product matches', () => {
    const rule = buildRule({ ruleType: 'PRODUCT', operator: 'IN', value: 'p1, p2' });
    expect(evaluateRule(rule, buildContext({ productIds: ['p2'] }))).toBe(true);
    expect(evaluateRule(rule, buildContext({ productIds: ['p3'] }))).toBe(false);
  });

  it('CATEGORY + IN passes when any cart category matches', () => {
    const rule = buildRule({ ruleType: 'CATEGORY', operator: 'IN', value: 'c1' });
    expect(evaluateRule(rule, buildContext({ categoryIds: ['c1', 'c2'] }))).toBe(true);
    expect(evaluateRule(rule, buildContext({ categoryIds: ['c2'] }))).toBe(false);
  });

  it('BRAND + IN passes when the cart brand matches', () => {
    const rule = buildRule({ ruleType: 'BRAND', operator: 'IN', value: 'b1' });
    expect(evaluateRule(rule, buildContext({ brandIds: ['b1'] }))).toBe(true);
    expect(evaluateRule(rule, buildContext({ brandIds: ['b2'] }))).toBe(false);
  });

  it('CUSTOMER + IN passes only for listed customers', () => {
    const rule = buildRule({ ruleType: 'CUSTOMER', operator: 'IN', value: 'cust-1' });
    expect(evaluateRule(rule, buildContext({ customerId: 'cust-1' }))).toBe(true);
    expect(evaluateRule(rule, buildContext({ customerId: 'cust-2' }))).toBe(false);
    expect(evaluateRule(rule, buildContext({ customerId: null }))).toBe(false);
  });
});

describe('isPromotionCurrentlyValid', () => {
  const now = new Date('2026-06-15T00:00:00Z');

  it('rejects an inactive promotion', () => {
    expect(isPromotionCurrentlyValid(buildPromotion({ status: 'INACTIVE' }), now)).toBe(false);
  });

  it('rejects a promotion that has not started yet', () => {
    const promotion = buildPromotion({ startsAt: new Date('2026-12-01T00:00:00Z') });
    expect(isPromotionCurrentlyValid(promotion, now)).toBe(false);
  });

  it('rejects a promotion that already ended', () => {
    const promotion = buildPromotion({ endsAt: new Date('2026-01-01T00:00:00Z') });
    expect(isPromotionCurrentlyValid(promotion, now)).toBe(false);
  });

  it('accepts a promotion within its vigency window', () => {
    const promotion = buildPromotion({
      startsAt: new Date('2026-01-01T00:00:00Z'),
      endsAt: new Date('2026-12-31T00:00:00Z'),
    });
    expect(isPromotionCurrentlyValid(promotion, now)).toBe(true);
  });
});

describe('isPromotionEligible', () => {
  it('rejects a promotion that reached its usage limit', () => {
    const promotion = buildPromotion({ usageLimit: 5, usageCount: 5 });
    expect(isPromotionEligible(promotion, buildContext())).toBe(false);
  });

  it('rejects a promotion whose rules are not met', () => {
    const promotion = buildPromotion({
      rules: [buildRule({ ruleType: 'MIN_CART_AMOUNT', operator: 'GTE', value: '2000' })],
    });
    expect(isPromotionEligible(promotion, buildContext({ subtotal: 1000 }))).toBe(false);
  });

  it('accepts a currently-valid promotion whose rules all pass', () => {
    const promotion = buildPromotion({
      rules: [buildRule({ ruleType: 'MIN_CART_AMOUNT', operator: 'GTE', value: '500' })],
    });
    expect(isPromotionEligible(promotion, buildContext({ subtotal: 1000 }))).toBe(true);
  });
});

describe('selectApplicablePromotions', () => {
  it('applies only the highest-priority promotion when it is not stackable', () => {
    const best = buildPromotion({ priority: 0, stackable: false });
    const other = buildPromotion({ priority: 1, stackable: true });
    expect(selectApplicablePromotions([other, best])).toEqual([best]);
  });

  it('combines consecutive stackable promotions in priority order', () => {
    const first = buildPromotion({ priority: 0, stackable: true });
    const second = buildPromotion({ priority: 1, stackable: true });
    const third = buildPromotion({ priority: 2, stackable: true });
    const result = selectApplicablePromotions([third, second, first]);
    expect(result).toEqual([first, second, third]);
  });

  it('excludes a non-stackable promotion that would join an already-stacking combo', () => {
    const first = buildPromotion({ priority: 0, stackable: true });
    const nonStackable = buildPromotion({ priority: 1, stackable: false });
    const third = buildPromotion({ priority: 2, stackable: true });
    const result = selectApplicablePromotions([first, nonStackable, third]);
    expect(result).toEqual([first, third]);
  });

  it('returns an empty array when there is nothing eligible', () => {
    expect(selectApplicablePromotions([])).toEqual([]);
  });
});

describe('calculateTotalDiscount', () => {
  it('sums the discount of every selected promotion, clamped to the subtotal', () => {
    const flat = buildPromotion({ discountType: 'FIXED', discountValue: 400 });
    const percent = buildPromotion({ discountType: 'PERCENTAGE', discountValue: 50 });
    expect(calculateTotalDiscount([flat, percent], 1000)).toBe(900);
  });

  it('never exceeds the subtotal even when discounts overshoot it', () => {
    const first = buildPromotion({ discountType: 'FIXED', discountValue: 800 });
    const second = buildPromotion({ discountType: 'FIXED', discountValue: 800 });
    expect(calculateTotalDiscount([first, second], 1000)).toBe(1000);
  });
});
