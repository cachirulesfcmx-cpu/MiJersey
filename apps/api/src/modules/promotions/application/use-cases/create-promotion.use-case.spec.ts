import type { CouponRepositoryPort } from '../../../cart/domain/ports/coupon.repository.port';
import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { PromotionEntity } from '../../domain/entities/promotion.entity';
import { PromotionCodeAlreadyExistsError } from '../../domain/errors/promotions.errors';
import type { PromotionRepositoryPort } from '../../domain/ports/promotion.repository.port';
import { CartCouponMirrorService } from '../services/cart-coupon-mirror.service';
import { CreatePromotionUseCase } from './create-promotion.use-case';

function buildPromotion(
  overrides: Partial<{ code: string | null; type: string; rules: unknown[] }> = {},
): PromotionEntity {
  return new PromotionEntity({
    id: 'promo-1',
    name: 'Test',
    code: overrides.code === undefined ? 'TEST10' : overrides.code,
    type: (overrides.type ?? 'MANUAL_COUPON') as never,
    discountType: 'PERCENTAGE' as never,
    discountValue: 10,
    status: 'ACTIVE' as never,
    priority: 0,
    startsAt: null,
    endsAt: null,
    usageLimit: null,
    usageCount: 0,
    stackable: false,
    rules: (overrides.rules ?? []) as never,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(
  options: { existingByCode?: PromotionEntity | null; created?: PromotionEntity } = {},
) {
  const created = options.created ?? buildPromotion();
  const promotions: jest.Mocked<PromotionRepositoryPort> = {
    findById: jest.fn(),
    findByCode: jest.fn().mockResolvedValue(options.existingByCode ?? null),
    findActiveAutomatic: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn().mockResolvedValue(created),
    update: jest.fn(),
    delete: jest.fn(),
    incrementUsageCount: jest.fn(),
  };
  const coupons: jest.Mocked<CouponRepositoryPort> = {
    findById: jest.fn(),
    findByCode: jest.fn().mockResolvedValue(null),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new CreatePromotionUseCase(promotions, new CartCouponMirrorService(coupons), auditLog),
    promotions,
    coupons,
    auditLog,
  };
}

const baseInput = {
  name: 'Test',
  code: 'TEST10',
  type: 'MANUAL_COUPON' as never,
  discountType: 'PERCENTAGE' as never,
  discountValue: 10,
  rules: [],
  actorUserId: 'admin-1',
  ipAddress: null,
};

describe('CreatePromotionUseCase', () => {
  it('throws PromotionCodeAlreadyExistsError when the code is taken', async () => {
    const { useCase } = buildUseCase({ existingByCode: buildPromotion() });

    await expect(useCase.execute(baseInput)).rejects.toThrow(PromotionCodeAlreadyExistsError);
  });

  it('mirrors a rule-less MANUAL_COUPON into Cart.Coupon', async () => {
    const { useCase, coupons } = buildUseCase();

    await useCase.execute(baseInput);

    expect(coupons.create).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'TEST10', value: 10 }),
    );
  });

  it('does not mirror a MANUAL_COUPON that has rules', async () => {
    const created = buildPromotion({ rules: [{ ruleType: 'MIN_CART_AMOUNT' }] });
    const { useCase, coupons } = buildUseCase({ created });

    await useCase.execute({
      ...baseInput,
      rules: [{ ruleType: 'MIN_CART_AMOUNT', operator: 'GTE', value: '500' } as never],
    });

    expect(coupons.create).not.toHaveBeenCalled();
  });

  it('does not mirror an AUTOMATIC promotion', async () => {
    const created = buildPromotion({ type: 'AUTOMATIC', code: null });
    const { useCase, coupons } = buildUseCase({ created });
    const automaticInput = {
      name: baseInput.name,
      discountType: baseInput.discountType,
      discountValue: baseInput.discountValue,
      rules: baseInput.rules,
      actorUserId: baseInput.actorUserId,
      ipAddress: baseInput.ipAddress,
      type: 'AUTOMATIC' as never,
    };

    await useCase.execute(automaticInput);

    expect(coupons.create).not.toHaveBeenCalled();
  });

  it('records an audit log entry', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute(baseInput);

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'promotion.created' }),
    );
  });
});
