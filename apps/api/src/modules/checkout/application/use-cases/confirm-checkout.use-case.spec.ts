import { CartEntity } from '../../../cart/domain/entities/cart.entity';
import { CartItemEntity } from '../../../cart/domain/entities/cart-item.entity';
import { CouponEntity } from '../../../cart/domain/entities/coupon.entity';
import type { CartRepositoryPort } from '../../../cart/domain/ports/cart.repository.port';
import type { CouponRepositoryPort } from '../../../cart/domain/ports/coupon.repository.port';
import { CartStatus, CouponType } from '../../../cart/domain/value-objects/cart-enums';
import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { CheckoutSessionEntity } from '../../domain/entities/checkout-session.entity';
import { OrderEntity } from '../../domain/entities/order.entity';
import { ShippingMethodEntity } from '../../domain/entities/shipping-method.entity';
import {
  CartEmptyError,
  CartItemsUnavailableError,
  CheckoutAlreadyConfirmedError,
  ContactEmailRequiredError,
} from '../../domain/errors/checkout.errors';
import type { CheckoutInventoryAvailabilityPort } from '../../domain/ports/checkout-inventory-availability.port';
import type { CheckoutProductLookupPort } from '../../domain/ports/checkout-product-lookup.port';
import type { CheckoutSessionRepositoryPort } from '../../domain/ports/checkout-session.repository.port';
import type { OrderRepositoryPort } from '../../domain/ports/order.repository.port';
import type { ShippingMethodRepositoryPort } from '../../domain/ports/shipping-method.repository.port';
import { CheckoutStatus } from '../../domain/value-objects/checkout-enums';
import { ConfirmCheckoutUseCase } from './confirm-checkout.use-case';

function buildSession(
  overrides: Partial<{ status: CheckoutStatus; contactEmail: string | null }> = {},
): CheckoutSessionEntity {
  return new CheckoutSessionEntity({
    id: 'checkout-1',
    cartId: 'cart-1',
    customerId: 'customer-1',
    sessionId: 'session-1',
    contactEmail:
      overrides.contactEmail !== undefined ? overrides.contactEmail : 'buyer@example.com',
    shippingAddressId: 'address-1',
    billingAddressId: 'address-1',
    shippingMethodId: 'method-1',
    status: overrides.status ?? CheckoutStatus.STARTED,
    orderId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildCart(items: CartItemEntity[], couponCode: string | null = null): CartEntity {
  return new CartEntity({
    id: 'cart-1',
    customerId: 'customer-1',
    sessionId: 'session-1',
    currency: 'MXN',
    status: CartStatus.ACTIVE,
    couponCode,
    items,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildItem(
  overrides: Partial<{ variantId: string; sku: string; quantity: number; unitPrice: number }> = {},
): CartItemEntity {
  return new CartItemEntity({
    id: 'item-1',
    cartId: 'cart-1',
    productId: 'product-1',
    variantId: overrides.variantId ?? 'variant-1',
    sku: overrides.sku ?? 'JR-M',
    quantity: overrides.quantity ?? 2,
    // El precio "congelado" en el carrito puede estar desactualizado a propósito en estas pruebas —
    // lo relevante es que ConfirmCheckoutUseCase use el precio vigente (productLookup), no este.
    unitPrice: overrides.unitPrice ?? 800,
    subtotal: (overrides.quantity ?? 2) * (overrides.unitPrice ?? 800),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildShippingMethod(basePrice = 100): ShippingMethodEntity {
  return new ShippingMethodEntity({
    id: 'method-1',
    name: 'Estándar',
    description: null,
    basePrice,
    estimatedDaysMin: 3,
    estimatedDaysMax: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildCoupon(overrides: Partial<{ isActive: boolean; expiresAt: Date | null }> = {}) {
  return new CouponEntity({
    id: 'coupon-1',
    code: 'DESCUENTO10',
    type: CouponType.PERCENTAGE,
    value: 10,
    isActive: overrides.isActive ?? true,
    expiresAt: overrides.expiresAt ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: {
  session: CheckoutSessionEntity | null;
  cart: CartEntity | null;
  shippingMethod?: ShippingMethodEntity | null;
  livePrice?: number;
  isAvailableForSale?: boolean;
  available?: number;
  coupon?: CouponEntity | null;
}) {
  const sessions: jest.Mocked<CheckoutSessionRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(options.session),
    findByCartId: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const shippingMethods: jest.Mocked<ShippingMethodRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(options.shippingMethod ?? buildShippingMethod()),
    findActive: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const productLookup: jest.Mocked<CheckoutProductLookupPort> = {
    findVariantInfoMany: jest.fn().mockImplementation(async (ids: string[]) => {
      const map = new Map();
      for (const id of ids) {
        map.set(id, {
          price: options.livePrice ?? 900,
          isAvailableForSale: options.isAvailableForSale ?? true,
        });
      }
      return map;
    }),
  };
  const availability: jest.Mocked<CheckoutInventoryAvailabilityPort> = {
    getAvailabilityMany: jest.fn().mockImplementation(async (ids: string[]) => {
      const map = new Map();
      for (const id of ids) map.set(id, options.available ?? 10);
      return map;
    }),
  };
  const orders: jest.Mocked<OrderRepositoryPort> = {
    findById: jest.fn(),
    create: jest.fn().mockImplementation(
      async (data) =>
        new OrderEntity({
          id: 'order-1',
          orderNumber: data.orderNumber,
          customerId: data.customerId,
          contactEmail: data.contactEmail,
          status: 'CONFIRMED' as never,
          paymentStatus: 'PENDING' as never,
          fulfillmentStatus: 'UNFULFILLED' as never,
          currency: data.currency,
          subtotal: data.subtotal,
          discountTotal: data.discountTotal,
          shippingTotal: data.shippingTotal,
          taxTotal: data.taxTotal,
          grandTotal: data.grandTotal,
          couponCode: data.couponCode,
          shippingAddressId: data.shippingAddressId,
          billingAddressId: data.billingAddressId,
          shippingMethodId: data.shippingMethodId,
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
    ),
  };
  const carts: jest.Mocked<CartRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(options.cart),
    findActiveBySessionId: jest.fn(),
    findActiveByCustomerId: jest.fn(),
    create: jest.fn(),
    attachCustomer: jest.fn(),
    updateStatus: jest.fn().mockResolvedValue(undefined),
    setCoupon: jest.fn(),
  };
  const coupons: jest.Mocked<CouponRepositoryPort> = {
    findById: jest.fn(),
    findByCode: jest.fn().mockResolvedValue(options.coupon ?? null),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new ConfirmCheckoutUseCase(
      sessions,
      shippingMethods,
      productLookup,
      availability,
      orders,
      carts,
      coupons,
      auditLog,
    ),
    sessions,
    orders,
    carts,
    auditLog,
  };
}

describe('ConfirmCheckoutUseCase', () => {
  it('throws when the checkout was already confirmed', async () => {
    const { useCase } = buildUseCase({
      session: buildSession({ status: CheckoutStatus.CONFIRMED }),
      cart: buildCart([buildItem()]),
    });

    await expect(
      useCase.execute({ checkoutSessionId: 'checkout-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(CheckoutAlreadyConfirmedError);
  });

  it('throws when there is no contact email', async () => {
    const { useCase } = buildUseCase({
      session: buildSession({ contactEmail: null }),
      cart: buildCart([buildItem()]),
    });

    await expect(
      useCase.execute({ checkoutSessionId: 'checkout-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(ContactEmailRequiredError);
  });

  it('throws when the cart is empty', async () => {
    const { useCase } = buildUseCase({ session: buildSession(), cart: buildCart([]) });

    await expect(
      useCase.execute({ checkoutSessionId: 'checkout-1', ipAddress: null }),
    ).rejects.toBeInstanceOf(CartEmptyError);
  });

  it('throws with the affected SKU when live stock is insufficient', async () => {
    const { useCase } = buildUseCase({
      session: buildSession(),
      cart: buildCart([buildItem({ sku: 'JR-M', quantity: 5 })]),
      available: 2,
    });

    await expect(
      useCase.execute({ checkoutSessionId: 'checkout-1', ipAddress: null }),
    ).rejects.toThrow(new CartItemsUnavailableError(['JR-M']).message);
  });

  it('uses the live variant price, not the stale price stored on the cart item', async () => {
    const { useCase, orders } = buildUseCase({
      session: buildSession(),
      cart: buildCart([buildItem({ quantity: 2, unitPrice: 800 })]),
      livePrice: 950,
    });

    await useCase.execute({ checkoutSessionId: 'checkout-1', ipAddress: null });

    expect(orders.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 1900,
        items: [expect.objectContaining({ unitPrice: 950, subtotal: 1900 })],
      }),
    );
  });

  it('applies a valid coupon discount and computes tax over (subtotal - discount + shipping)', async () => {
    const { useCase, orders } = buildUseCase({
      session: buildSession(),
      cart: buildCart([buildItem({ quantity: 1, unitPrice: 1000 })], 'DESCUENTO10'),
      livePrice: 1000,
      coupon: buildCoupon(),
      shippingMethod: buildShippingMethod(100),
    });

    await useCase.execute({ checkoutSessionId: 'checkout-1', ipAddress: null });

    // subtotal 1000, descuento 10% = 100, envío 100 → base gravable 1000, IVA 16% = 160, total 1160
    expect(orders.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 1000,
        discountTotal: 100,
        shippingTotal: 100,
        taxTotal: 160,
        grandTotal: 1160,
        couponCode: 'DESCUENTO10',
      }),
    );
  });

  it('ignores an expired coupon (no discount, coupon code cleared)', async () => {
    const { useCase, orders } = buildUseCase({
      session: buildSession(),
      cart: buildCart([buildItem({ quantity: 1, unitPrice: 1000 })], 'DESCUENTO10'),
      livePrice: 1000,
      coupon: buildCoupon({ expiresAt: new Date('2000-01-01') }),
    });

    await useCase.execute({ checkoutSessionId: 'checkout-1', ipAddress: null });

    expect(orders.create).toHaveBeenCalledWith(
      expect.objectContaining({ discountTotal: 0, couponCode: null }),
    );
  });

  it('marks the cart as CONVERTED and the session as CONFIRMED, and records an audit entry', async () => {
    const { useCase, sessions, carts, auditLog } = buildUseCase({
      session: buildSession(),
      cart: buildCart([buildItem()]),
    });

    const order = await useCase.execute({
      checkoutSessionId: 'checkout-1',
      ipAddress: '127.0.0.1',
    });

    expect(carts.updateStatus).toHaveBeenCalledWith('cart-1', CartStatus.CONVERTED);
    expect(sessions.update).toHaveBeenCalledWith('checkout-1', {
      status: CheckoutStatus.CONFIRMED,
      orderId: order.id,
    });
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'checkout.confirmed' }),
    );
  });
});
