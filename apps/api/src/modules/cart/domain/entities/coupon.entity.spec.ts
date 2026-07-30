import { CouponType } from '../value-objects/cart-enums';
import { CouponEntity } from './coupon.entity';

function buildCoupon(
  overrides: Partial<{ type: CouponType; value: number; expiresAt: Date | null }> = {},
) {
  return new CouponEntity({
    id: 'coupon-1',
    code: 'PROMO10',
    type: overrides.type ?? CouponType.PERCENTAGE,
    value: overrides.value ?? 10,
    isActive: true,
    expiresAt: overrides.expiresAt ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('CouponEntity', () => {
  it('computes a percentage discount over the subtotal', () => {
    const coupon = buildCoupon({ type: CouponType.PERCENTAGE, value: 10 });
    expect(coupon.computeDiscount(1000)).toBe(100);
  });

  it('computes a fixed discount capped at the subtotal', () => {
    const coupon = buildCoupon({ type: CouponType.FIXED, value: 5000 });
    expect(coupon.computeDiscount(1000)).toBe(1000);
  });

  it('never returns a negative discount', () => {
    const coupon = buildCoupon({ type: CouponType.FIXED, value: -50 });
    expect(coupon.computeDiscount(1000)).toBe(0);
  });

  it('reports as expired when expiresAt is in the past', () => {
    const coupon = buildCoupon({ expiresAt: new Date(Date.now() - 1000) });
    expect(coupon.isExpired).toBe(true);
  });

  it('reports as not expired when expiresAt is in the future or absent', () => {
    expect(buildCoupon({ expiresAt: new Date(Date.now() + 100000) }).isExpired).toBe(false);
    expect(buildCoupon({ expiresAt: null }).isExpired).toBe(false);
  });
});
