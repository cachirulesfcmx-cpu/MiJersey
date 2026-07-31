import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { WishlistItemEntity } from '../../domain/entities/wishlist-item.entity';
import { WishlistItemNotFoundError } from '../../domain/errors/wishlist.errors';
import type { WishlistItemRepositoryPort } from '../../domain/ports/wishlist-item.repository.port';
import { RemoveWishlistItemUseCase } from './remove-wishlist-item.use-case';

function buildItem(
  overrides: Partial<{ id: string; wishlistId: string }> = {},
): WishlistItemEntity {
  return new WishlistItemEntity({
    id: overrides.id ?? 'item-1',
    wishlistId: overrides.wishlistId ?? 'wishlist-1',
    productId: 'product-1',
    variantId: 'variant-1',
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
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new RemoveWishlistItemUseCase(items, auditLog), items, auditLog };
}

describe('RemoveWishlistItemUseCase', () => {
  it('throws WishlistItemNotFoundError when the item does not exist', async () => {
    const { useCase } = buildUseCase({ existingItem: null });

    await expect(
      useCase.execute({ wishlistId: 'wishlist-1', itemId: 'item-1', customerId: 'customer-1' }),
    ).rejects.toThrow(WishlistItemNotFoundError);
  });

  it('throws WishlistItemNotFoundError (not a 403) when the item belongs to a different wishlist', async () => {
    const foreignItem = buildItem({ wishlistId: 'wishlist-other' });
    const { useCase, items } = buildUseCase({ existingItem: foreignItem });

    await expect(
      useCase.execute({ wishlistId: 'wishlist-1', itemId: 'item-1', customerId: 'customer-1' }),
    ).rejects.toThrow(WishlistItemNotFoundError);
    expect(items.delete).not.toHaveBeenCalled();
  });

  it('deletes the item and records an audit log entry when it belongs to the wishlist', async () => {
    const { useCase, items, auditLog } = buildUseCase();

    await useCase.execute({ wishlistId: 'wishlist-1', itemId: 'item-1', customerId: 'customer-1' });

    expect(items.delete).toHaveBeenCalledWith('item-1');
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'wishlist.item_removed' }),
    );
  });
});
