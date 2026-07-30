import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { CartEntity } from '../../domain/entities/cart.entity';
import { CartItemEntity } from '../../domain/entities/cart-item.entity';
import type { CartRepositoryPort } from '../../domain/ports/cart.repository.port';
import type { CartInventoryAvailabilityPort } from '../../domain/ports/cart-inventory-availability.port';
import type { CartItemRepositoryPort } from '../../domain/ports/cart-item.repository.port';
import { CartStatus } from '../../domain/value-objects/cart-enums';
import type { GetOrCreateCartUseCase } from './get-or-create-cart.use-case';
import { MergeCartUseCase } from './merge-cart.use-case';

function buildCart(overrides: Partial<{ id: string; customerId: string | null }> = {}): CartEntity {
  return new CartEntity({
    id: overrides.id ?? 'cart-1',
    customerId: overrides.customerId ?? null,
    sessionId: 'session-1',
    currency: 'MXN',
    status: CartStatus.ACTIVE,
    couponCode: null,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildItem(
  overrides: Partial<{ id: string; variantId: string; quantity: number; unitPrice: number }> = {},
): CartItemEntity {
  return new CartItemEntity({
    id: overrides.id ?? 'item-1',
    cartId: 'guest-cart',
    productId: 'product-1',
    variantId: overrides.variantId ?? 'variant-1',
    sku: 'JR-M',
    quantity: overrides.quantity ?? 1,
    unitPrice: overrides.unitPrice ?? 899,
    subtotal: (overrides.quantity ?? 1) * (overrides.unitPrice ?? 899),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: {
  guestCart: CartEntity | null;
  customerCart: CartEntity | null;
  guestItems?: CartItemEntity[];
  existingCustomerItem?: CartItemEntity | null;
  available?: number;
}) {
  const carts: jest.Mocked<CartRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(options.customerCart),
    findActiveBySessionId: jest.fn().mockResolvedValue(options.guestCart),
    findActiveByCustomerId: jest.fn().mockResolvedValue(options.customerCart),
    create: jest.fn(),
    attachCustomer: jest.fn().mockResolvedValue(buildCart({ customerId: 'customer-1' })),
    updateStatus: jest.fn().mockResolvedValue(undefined),
    setCoupon: jest.fn(),
  };
  const items: jest.Mocked<CartItemRepositoryPort> = {
    findById: jest.fn(),
    findByCartId: jest.fn().mockResolvedValue(options.guestItems ?? []),
    findByCartAndVariant: jest.fn().mockResolvedValue(options.existingCustomerItem ?? null),
    create: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const availability: jest.Mocked<CartInventoryAvailabilityPort> = {
    getAvailability: jest.fn().mockResolvedValue(options.available ?? 10),
    getAvailabilityMany: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const getOrCreateCart = {
    execute: jest.fn().mockResolvedValue(buildCart()),
  } as unknown as jest.Mocked<GetOrCreateCartUseCase>;

  return {
    useCase: new MergeCartUseCase(carts, items, availability, auditLog, getOrCreateCart),
    carts,
    items,
    auditLog,
    getOrCreateCart,
  };
}

describe('MergeCartUseCase', () => {
  it('delegates to GetOrCreateCart when there is no guest cart', async () => {
    const { useCase, getOrCreateCart } = buildUseCase({ guestCart: null, customerCart: null });

    await useCase.execute({ sessionId: 'session-1', customerId: 'customer-1' });

    expect(getOrCreateCart.execute).toHaveBeenCalledWith({
      sessionId: 'session-1',
      customerId: 'customer-1',
    });
  });

  it('adopts the guest cart when the customer has no active cart yet', async () => {
    const guestCart = buildCart({ id: 'guest-cart', customerId: null });
    const { useCase, carts } = buildUseCase({ guestCart, customerCart: null });

    await useCase.execute({ sessionId: 'session-1', customerId: 'customer-1' });

    expect(carts.attachCustomer).toHaveBeenCalledWith('guest-cart', 'customer-1');
  });

  it('merges guest items into the customer cart and marks the guest cart as MERGED', async () => {
    const guestCart = buildCart({ id: 'guest-cart', customerId: null });
    const customerCart = buildCart({ id: 'customer-cart', customerId: 'customer-1' });
    const guestItem = buildItem({ id: 'guest-item-1', variantId: 'variant-1', quantity: 2 });
    const { useCase, carts, items, auditLog } = buildUseCase({
      guestCart,
      customerCart,
      guestItems: [guestItem],
      existingCustomerItem: null,
      available: 10,
    });

    await useCase.execute({ sessionId: 'session-1', customerId: 'customer-1' });

    expect(items.create).toHaveBeenCalledWith(
      expect.objectContaining({ cartId: 'customer-cart', variantId: 'variant-1', quantity: 2 }),
    );
    expect(items.delete).toHaveBeenCalledWith('guest-item-1');
    expect(carts.updateStatus).toHaveBeenCalledWith('guest-cart', 'MERGED');
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'cart.merged' }),
    );
  });

  it('sums quantities when both carts already have the same variant, capped at availability', async () => {
    const guestCart = buildCart({ id: 'guest-cart', customerId: null });
    const customerCart = buildCart({ id: 'customer-cart', customerId: 'customer-1' });
    const guestItem = buildItem({ id: 'guest-item-1', variantId: 'variant-1', quantity: 5 });
    const existingCustomerItem = buildItem({
      id: 'customer-item-1',
      variantId: 'variant-1',
      quantity: 3,
    });
    const { useCase, items } = buildUseCase({
      guestCart,
      customerCart,
      guestItems: [guestItem],
      existingCustomerItem,
      available: 6,
    });

    await useCase.execute({ sessionId: 'session-1', customerId: 'customer-1' });

    expect(items.update).toHaveBeenCalledWith(
      'customer-item-1',
      expect.objectContaining({ quantity: 6 }),
    );
  });

  it('is a no-op when the guest cart already belongs to the customer', async () => {
    const guestCart = buildCart({ id: 'cart-1', customerId: 'customer-1' });
    const { useCase, carts } = buildUseCase({ guestCart, customerCart: guestCart });

    const result = await useCase.execute({ sessionId: 'session-1', customerId: 'customer-1' });

    expect(result).toBe(guestCart);
    expect(carts.attachCustomer).not.toHaveBeenCalled();
    expect(carts.updateStatus).not.toHaveBeenCalled();
  });
});
