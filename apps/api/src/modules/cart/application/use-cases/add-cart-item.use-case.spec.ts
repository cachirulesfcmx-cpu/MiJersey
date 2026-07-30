import { CartEntity } from '../../domain/entities/cart.entity';
import { CartItemEntity } from '../../domain/entities/cart-item.entity';
import {
  InsufficientInventoryError,
  ProductNotAvailableError,
} from '../../domain/errors/cart.errors';
import type { CartRepositoryPort } from '../../domain/ports/cart.repository.port';
import type { CartInventoryAvailabilityPort } from '../../domain/ports/cart-inventory-availability.port';
import type { CartItemRepositoryPort } from '../../domain/ports/cart-item.repository.port';
import type {
  CartProductLookupPort,
  CartVariantInfo,
} from '../../domain/ports/cart-product-lookup.port';
import { CartStatus } from '../../domain/value-objects/cart-enums';
import { AddCartItemUseCase } from './add-cart-item.use-case';

function buildCart(items: CartItemEntity[] = []): CartEntity {
  return new CartEntity({
    id: 'cart-1',
    customerId: null,
    sessionId: 'session-1',
    currency: 'MXN',
    status: CartStatus.ACTIVE,
    couponCode: null,
    items,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildVariantInfo(overrides: Partial<CartVariantInfo> = {}): CartVariantInfo {
  return {
    productId: 'product-1',
    productName: 'Jersey',
    productSlug: 'jersey',
    variantId: 'variant-1',
    variantTitle: 'M',
    sku: 'JR-M',
    price: 899,
    imageId: null,
    isAvailableForSale: true,
    ...overrides,
  };
}

function buildExistingItem(
  overrides: Partial<{ quantity: number; unitPrice: number }> = {},
): CartItemEntity {
  return new CartItemEntity({
    id: 'item-1',
    cartId: 'cart-1',
    productId: 'product-1',
    variantId: 'variant-1',
    sku: 'JR-M',
    quantity: overrides.quantity ?? 1,
    unitPrice: overrides.unitPrice ?? 899,
    subtotal: (overrides.quantity ?? 1) * (overrides.unitPrice ?? 899),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: {
  cart: CartEntity | null;
  variantInfo: CartVariantInfo | null;
  existingItem?: CartItemEntity | null;
  available: number;
}) {
  const carts: jest.Mocked<CartRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(options.cart),
    findActiveBySessionId: jest.fn(),
    findActiveByCustomerId: jest.fn(),
    create: jest.fn(),
    attachCustomer: jest.fn(),
    updateStatus: jest.fn(),
    setCoupon: jest.fn(),
  };
  const items: jest.Mocked<CartItemRepositoryPort> = {
    findById: jest.fn(),
    findByCartId: jest.fn(),
    findByCartAndVariant: jest.fn().mockResolvedValue(options.existingItem ?? null),
    create: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn(),
  };
  const productLookup: jest.Mocked<CartProductLookupPort> = {
    findVariantInfo: jest.fn().mockResolvedValue(options.variantInfo),
    findVariantInfoMany: jest.fn(),
  };
  const availability: jest.Mocked<CartInventoryAvailabilityPort> = {
    getAvailability: jest.fn().mockResolvedValue(options.available),
    getAvailabilityMany: jest.fn(),
  };

  return {
    useCase: new AddCartItemUseCase(carts, items, productLookup, availability),
    carts,
    items,
  };
}

describe('AddCartItemUseCase', () => {
  it('throws when the variant is not available for sale', async () => {
    const { useCase } = buildUseCase({
      cart: buildCart(),
      variantInfo: buildVariantInfo({ isAvailableForSale: false }),
      available: 10,
    });

    await expect(
      useCase.execute({ cartId: 'cart-1', variantId: 'variant-1', quantity: 1 }),
    ).rejects.toBeInstanceOf(ProductNotAvailableError);
  });

  it('throws when requested quantity exceeds availability', async () => {
    const { useCase } = buildUseCase({
      cart: buildCart(),
      variantInfo: buildVariantInfo(),
      available: 2,
    });

    await expect(
      useCase.execute({ cartId: 'cart-1', variantId: 'variant-1', quantity: 3 }),
    ).rejects.toBeInstanceOf(InsufficientInventoryError);
  });

  it('creates a new line when the variant is not already in the cart', async () => {
    const { useCase, items } = buildUseCase({
      cart: buildCart(),
      variantInfo: buildVariantInfo({ price: 899 }),
      available: 10,
    });

    await useCase.execute({ cartId: 'cart-1', variantId: 'variant-1', quantity: 2 });

    expect(items.create).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 2, unitPrice: 899, subtotal: 1798 }),
    );
  });

  it('sums quantities and refreshes the unit price when the variant is already in the cart', async () => {
    const existing = buildExistingItem({ quantity: 1, unitPrice: 800 });
    const { useCase, items } = buildUseCase({
      cart: buildCart([existing]),
      variantInfo: buildVariantInfo({ price: 899 }),
      existingItem: existing,
      available: 10,
    });

    await useCase.execute({ cartId: 'cart-1', variantId: 'variant-1', quantity: 2 });

    expect(items.update).toHaveBeenCalledWith(
      'item-1',
      expect.objectContaining({ quantity: 3, unitPrice: 899, subtotal: 2697 }),
    );
  });
});
