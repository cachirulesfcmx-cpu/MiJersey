import { CheckoutSessionEntity } from '../../domain/entities/checkout-session.entity';
import {
  CartEmptyError,
  CartItemsUnavailableError,
  ShippingAddressRequiredError,
  ShippingMethodRequiredError,
} from '../../domain/errors/checkout.errors';
import type { CheckoutSessionRepositoryPort } from '../../domain/ports/checkout-session.repository.port';
import { CheckoutStatus } from '../../domain/value-objects/checkout-enums';
import type { CheckoutView } from '../../domain/value-objects/checkout-view';
import type { BuildCheckoutViewUseCase } from './build-checkout-view.use-case';
import { ReviewCheckoutUseCase } from './review-checkout.use-case';

function buildSession(
  overrides: Partial<{ shippingAddressId: string | null; shippingMethodId: string | null }> = {},
): CheckoutSessionEntity {
  return new CheckoutSessionEntity({
    id: 'checkout-1',
    cartId: 'cart-1',
    customerId: null,
    sessionId: 'session-1',
    contactEmail: 'buyer@example.com',
    shippingAddressId:
      overrides.shippingAddressId !== undefined ? overrides.shippingAddressId : 'address-1',
    billingAddressId: null,
    shippingMethodId:
      overrides.shippingMethodId !== undefined ? overrides.shippingMethodId : 'method-1',
    status: CheckoutStatus.STARTED,
    orderId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildView(itemOverrides: Partial<{ inStock: boolean; sku: string }>[] = []): CheckoutView {
  return {
    id: 'checkout-1',
    cartId: 'cart-1',
    customerId: null,
    sessionId: 'session-1',
    contactEmail: 'buyer@example.com',
    status: CheckoutStatus.STARTED,
    cart: {
      id: 'cart-1',
      customerId: null,
      sessionId: 'session-1',
      currency: 'MXN',
      status: 'ACTIVE' as never,
      items: itemOverrides.map((override, index) => ({
        id: `item-${index}`,
        productId: 'product-1',
        productName: 'Jersey',
        productSlug: 'jersey',
        variantId: 'variant-1',
        variantTitle: 'M',
        sku: override.sku ?? 'JR-M',
        imageUrl: null,
        quantity: 1,
        unitPrice: 500,
        subtotal: 500,
        availableQuantity: 10,
        inStock: override.inStock ?? true,
      })),
      coupon: null,
      subtotal: 500 * itemOverrides.length,
      discount: 0,
      total: 500 * itemOverrides.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    shippingAddress: null,
    billingAddress: null,
    shippingMethod: null,
    shippingCost: 100,
    taxAmount: 96,
    grandTotal: 696,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function buildUseCase(options: { session: CheckoutSessionEntity | null; view: CheckoutView }) {
  const sessions: jest.Mocked<CheckoutSessionRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(options.session),
    findByCartId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  const buildView = {
    execute: jest.fn().mockResolvedValue(options.view),
  } as unknown as jest.Mocked<BuildCheckoutViewUseCase>;

  return { useCase: new ReviewCheckoutUseCase(sessions, buildView), sessions, buildView };
}

describe('ReviewCheckoutUseCase', () => {
  it('throws when the shipping address is missing', async () => {
    const { useCase } = buildUseCase({
      session: buildSession({ shippingAddressId: null }),
      view: buildView([{ inStock: true }]),
    });

    await expect(useCase.execute({ checkoutSessionId: 'checkout-1' })).rejects.toBeInstanceOf(
      ShippingAddressRequiredError,
    );
  });

  it('throws when the shipping method is missing', async () => {
    const { useCase } = buildUseCase({
      session: buildSession({ shippingMethodId: null }),
      view: buildView([{ inStock: true }]),
    });

    await expect(useCase.execute({ checkoutSessionId: 'checkout-1' })).rejects.toBeInstanceOf(
      ShippingMethodRequiredError,
    );
  });

  it('throws when the cart is empty', async () => {
    const { useCase } = buildUseCase({ session: buildSession(), view: buildView([]) });

    await expect(useCase.execute({ checkoutSessionId: 'checkout-1' })).rejects.toBeInstanceOf(
      CartEmptyError,
    );
  });

  it('throws with the affected SKUs when some items are no longer available', async () => {
    const { useCase } = buildUseCase({
      session: buildSession(),
      view: buildView([
        { inStock: true, sku: 'OK-1' },
        { inStock: false, sku: 'OUT-1' },
      ]),
    });

    await expect(useCase.execute({ checkoutSessionId: 'checkout-1' })).rejects.toThrow(
      new CartItemsUnavailableError(['OUT-1']).message,
    );
  });

  it('returns the composed view when everything is valid', async () => {
    const view = buildView([{ inStock: true }]);
    const { useCase } = buildUseCase({ session: buildSession(), view });

    const result = await useCase.execute({ checkoutSessionId: 'checkout-1' });

    expect(result).toBe(view);
  });
});
