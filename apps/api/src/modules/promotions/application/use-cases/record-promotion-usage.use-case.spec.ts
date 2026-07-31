import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { OrderEntity } from '../../../orders/domain/entities/order.entity';
import { OrderItemEntity } from '../../../orders/domain/entities/order-item.entity';
import type { OrderRepositoryPort } from '../../../orders/domain/ports/order.repository.port';
import {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
} from '../../../orders/domain/value-objects/order-enums';
import { PromotionEntity } from '../../domain/entities/promotion.entity';
import { PromotionUsageEntity } from '../../domain/entities/promotion-usage.entity';
import { OrderNotFoundError } from '../../domain/errors/promotions.errors';
import type { PromotionRepositoryPort } from '../../domain/ports/promotion.repository.port';
import type { PromotionUsageRepositoryPort } from '../../domain/ports/promotion-usage.repository.port';
import { RecordPromotionUsageUseCase } from './record-promotion-usage.use-case';

function buildOrder(overrides: Partial<{ couponCode: string | null }> = {}): OrderEntity {
  return new OrderEntity({
    id: 'order-1',
    orderNumber: 'ORD-1',
    customerId: 'customer-1',
    contactEmail: 'a@example.com',
    status: OrderStatus.CONFIRMED,
    paymentStatus: PaymentStatus.PAID,
    fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
    currency: 'MXN',
    subtotal: 1000,
    discountTotal: 100,
    shippingTotal: 0,
    taxTotal: 160,
    grandTotal: 1060,
    couponCode: overrides.couponCode === undefined ? 'TEST10' : overrides.couponCode,
    shippingAddressId: null,
    billingAddressId: null,
    shippingMethodId: null,
    cancelledAt: null,
    cancelReason: null,
    items: [
      new OrderItemEntity({
        id: 'item-1',
        orderId: 'order-1',
        productId: 'p1',
        variantId: 'v1',
        sku: 'SKU-1',
        quantity: 1,
        unitPrice: 1000,
        subtotal: 1000,
      }),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildPromotion(): PromotionEntity {
  return new PromotionEntity({
    id: 'promo-1',
    name: 'Test',
    code: 'TEST10',
    type: 'MANUAL_COUPON' as never,
    discountType: 'PERCENTAGE' as never,
    discountValue: 10,
    status: 'ACTIVE' as never,
    priority: 0,
    startsAt: null,
    endsAt: null,
    usageLimit: null,
    usageCount: 0,
    stackable: false,
    rules: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(
  options: {
    order?: OrderEntity | null;
    existingUsage?: PromotionUsageEntity | null;
    promotion?: PromotionEntity | null;
  } = {},
) {
  const orders: jest.Mocked<OrderRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(options.order === undefined ? buildOrder() : options.order),
    findByCustomerId: jest.fn(),
    findAll: jest.fn(),
    cancel: jest.fn(),
    updateField: jest.fn(),
  };
  const promotions: jest.Mocked<PromotionRepositoryPort> = {
    findById: jest.fn(),
    findByCode: jest
      .fn()
      .mockResolvedValue(options.promotion === undefined ? buildPromotion() : options.promotion),
    findActiveAutomatic: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    incrementUsageCount: jest.fn().mockResolvedValue(undefined),
  };
  const createdUsage = new PromotionUsageEntity({
    id: 'usage-1',
    promotionId: 'promo-1',
    orderId: 'order-1',
    customerId: 'customer-1',
    discountAmount: 100,
    createdAt: new Date(),
  });
  const usages: jest.Mocked<PromotionUsageRepositoryPort> = {
    findByOrderId: jest.fn().mockResolvedValue(options.existingUsage ?? null),
    create: jest.fn().mockResolvedValue(createdUsage),
    findMany: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new RecordPromotionUsageUseCase(orders, promotions, usages, auditLog),
    orders,
    promotions,
    usages,
    auditLog,
  };
}

describe('RecordPromotionUsageUseCase', () => {
  it('throws OrderNotFoundError when the order does not exist', async () => {
    const { useCase } = buildUseCase({ order: null });

    await expect(useCase.execute({ orderId: 'order-1' })).rejects.toThrow(OrderNotFoundError);
  });

  it('returns null when the order has no coupon', async () => {
    const { useCase, usages } = buildUseCase({ order: buildOrder({ couponCode: null }) });

    const result = await useCase.execute({ orderId: 'order-1' });

    expect(result).toBeNull();
    expect(usages.create).not.toHaveBeenCalled();
  });

  it('is idempotent when a usage already exists for the order', async () => {
    const existing = new PromotionUsageEntity({
      id: 'usage-existing',
      promotionId: 'promo-1',
      orderId: 'order-1',
      customerId: 'customer-1',
      discountAmount: 100,
      createdAt: new Date(),
    });
    const { useCase, usages } = buildUseCase({ existingUsage: existing });

    const result = await useCase.execute({ orderId: 'order-1' });

    expect(result).toBe(existing);
    expect(usages.create).not.toHaveBeenCalled();
  });

  it('returns null when the coupon code does not match any promotion', async () => {
    const { useCase, usages } = buildUseCase({ promotion: null });

    const result = await useCase.execute({ orderId: 'order-1' });

    expect(result).toBeNull();
    expect(usages.create).not.toHaveBeenCalled();
  });

  it('creates the usage and increments the promotion usage count', async () => {
    const { useCase, usages, promotions, auditLog } = buildUseCase();

    await useCase.execute({ orderId: 'order-1' });

    expect(usages.create).toHaveBeenCalledWith(
      expect.objectContaining({ promotionId: 'promo-1', orderId: 'order-1', discountAmount: 100 }),
    );
    expect(promotions.incrementUsageCount).toHaveBeenCalledWith('promo-1');
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'promotion.used' }),
    );
  });
});
