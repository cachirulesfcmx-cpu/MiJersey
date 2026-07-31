import type { AddCartItemUseCase } from '../../../cart/application/use-cases/add-cart-item.use-case';
import type { GetOrCreateCartUseCase } from '../../../cart/application/use-cases/get-or-create-cart.use-case';
import type { CartEntity } from '../../../cart/domain/entities/cart.entity';
import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { WishlistItemEntity } from '../../domain/entities/wishlist-item.entity';
import { WishlistItemNotFoundError } from '../../domain/errors/wishlist.errors';
import type { WishlistItemRepositoryPort } from '../../domain/ports/wishlist-item.repository.port';
import { MoveWishlistItemToCartUseCase } from './move-wishlist-item-to-cart.use-case';

function buildItem(
  overrides: Partial<{ id: string; wishlistId: string; variantId: string }> = {},
): WishlistItemEntity {
  return new WishlistItemEntity({
    id: overrides.id ?? 'item-1',
    wishlistId: overrides.wishlistId ?? 'wishlist-1',
    productId: 'product-1',
    variantId: overrides.variantId ?? 'variant-1',
    createdAt: new Date(),
  });
}

function buildUseCase(options: { existingItem?: WishlistItemEntity | null } = {}) {
  const items: jest.Mocked<WishlistItemRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(options.existingItem === undefined ? buildItem() : options.existingItem),
    findByWishlistAndVariant: jest.fn(),
    create: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
  };
  const getOrCreateCart = {
    execute: jest.fn().mockResolvedValue({ id: 'cart-1' } as CartEntity),
  } as unknown as jest.Mocked<GetOrCreateCartUseCase>;
  const addCartItem = {
    execute: jest.fn().mockResolvedValue({} as CartEntity),
  } as unknown as jest.Mocked<AddCartItemUseCase>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new MoveWishlistItemToCartUseCase(items, getOrCreateCart, addCartItem, auditLog),
    items,
    getOrCreateCart,
    addCartItem,
    auditLog,
  };
}

describe('MoveWishlistItemToCartUseCase', () => {
  it('throws WishlistItemNotFoundError when the item does not belong to the wishlist', async () => {
    const { useCase, addCartItem } = buildUseCase({
      existingItem: buildItem({ wishlistId: 'wishlist-other' }),
    });

    await expect(
      useCase.execute({
        wishlistId: 'wishlist-1',
        itemId: 'item-1',
        customerId: 'customer-1',
        sessionId: 'session-1',
      }),
    ).rejects.toThrow(WishlistItemNotFoundError);
    expect(addCartItem.execute).not.toHaveBeenCalled();
  });

  it('reuses GetOrCreateCartUseCase and AddCartItemUseCase to add the variant to the cart', async () => {
    const { useCase, getOrCreateCart, addCartItem } = buildUseCase();

    await useCase.execute({
      wishlistId: 'wishlist-1',
      itemId: 'item-1',
      customerId: 'customer-1',
      sessionId: 'session-1',
    });

    expect(getOrCreateCart.execute).toHaveBeenCalledWith({
      sessionId: 'session-1',
      customerId: 'customer-1',
    });
    expect(addCartItem.execute).toHaveBeenCalledWith({
      cartId: 'cart-1',
      variantId: 'variant-1',
      quantity: 1,
    });
  });

  it('removes the item from the wishlist after moving it to the cart', async () => {
    const { useCase, items } = buildUseCase();

    await useCase.execute({
      wishlistId: 'wishlist-1',
      itemId: 'item-1',
      customerId: 'customer-1',
      sessionId: 'session-1',
    });

    expect(items.delete).toHaveBeenCalledWith('item-1');
  });

  it('records an audit log entry', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute({
      wishlistId: 'wishlist-1',
      itemId: 'item-1',
      customerId: 'customer-1',
      sessionId: 'session-1',
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'wishlist.item_moved_to_cart' }),
    );
  });
});
