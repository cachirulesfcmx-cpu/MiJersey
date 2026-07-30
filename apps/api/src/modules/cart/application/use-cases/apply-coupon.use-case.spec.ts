import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { CartEntity } from '../../domain/entities/cart.entity';
import { CouponEntity } from '../../domain/entities/coupon.entity';
import {
  CouponExpiredError,
  CouponInactiveError,
  CouponNotFoundError,
} from '../../domain/errors/cart.errors';
import type { CartRepositoryPort } from '../../domain/ports/cart.repository.port';
import type { CouponRepositoryPort } from '../../domain/ports/coupon.repository.port';
import { CartStatus, CouponType } from '../../domain/value-objects/cart-enums';
import { ApplyCouponUseCase } from './apply-coupon.use-case';

function buildCart(): CartEntity {
  return new CartEntity({
    id: 'cart-1',
    customerId: null,
    sessionId: 'session-1',
    currency: 'MXN',
    status: CartStatus.ACTIVE,
    couponCode: null,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildCoupon(
  overrides: Partial<{ isActive: boolean; expiresAt: Date | null }> = {},
): CouponEntity {
  return new CouponEntity({
    id: 'coupon-1',
    code: 'PROMO10',
    type: CouponType.PERCENTAGE,
    value: 10,
    isActive: overrides.isActive ?? true,
    expiresAt: overrides.expiresAt ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(coupon: CouponEntity | null) {
  const carts: jest.Mocked<CartRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(buildCart()),
    findActiveBySessionId: jest.fn(),
    findActiveByCustomerId: jest.fn(),
    create: jest.fn(),
    attachCustomer: jest.fn(),
    updateStatus: jest.fn(),
    setCoupon: jest.fn().mockResolvedValue(buildCart()),
  };
  const coupons: jest.Mocked<CouponRepositoryPort> = {
    findById: jest.fn(),
    findByCode: jest.fn().mockResolvedValue(coupon),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new ApplyCouponUseCase(carts, coupons, auditLog), carts, auditLog };
}

describe('ApplyCouponUseCase', () => {
  it('throws when the coupon does not exist', async () => {
    const { useCase } = buildUseCase(null);

    await expect(
      useCase.execute({ cartId: 'cart-1', code: 'MISSING', sessionId: 'session-1' }),
    ).rejects.toBeInstanceOf(CouponNotFoundError);
  });

  it('throws when the coupon is inactive', async () => {
    const { useCase } = buildUseCase(buildCoupon({ isActive: false }));

    await expect(
      useCase.execute({ cartId: 'cart-1', code: 'PROMO10', sessionId: 'session-1' }),
    ).rejects.toBeInstanceOf(CouponInactiveError);
  });

  it('throws when the coupon is expired', async () => {
    const { useCase } = buildUseCase(buildCoupon({ expiresAt: new Date(Date.now() - 1000) }));

    await expect(
      useCase.execute({ cartId: 'cart-1', code: 'PROMO10', sessionId: 'session-1' }),
    ).rejects.toBeInstanceOf(CouponExpiredError);
  });

  it('normalizes the code, applies the coupon, and records an audit log entry', async () => {
    const { useCase, carts, auditLog } = buildUseCase(buildCoupon());

    await useCase.execute({ cartId: 'cart-1', code: ' promo10 ', sessionId: 'session-1' });

    expect(carts.setCoupon).toHaveBeenCalledWith('cart-1', 'PROMO10');
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'cart.coupon.applied' }),
    );
  });
});
