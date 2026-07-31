import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { WishlistEntity } from '../../domain/entities/wishlist.entity';
import type { WishlistRepositoryPort } from '../../domain/ports/wishlist.repository.port';
import { ShareWishlistUseCase } from './share-wishlist.use-case';

function buildWishlist(overrides: Partial<{ shareToken: string | null }> = {}): WishlistEntity {
  return new WishlistEntity({
    id: 'wishlist-1',
    customerId: 'customer-1',
    name: 'Mi lista de deseos',
    isDefault: true,
    shareToken: overrides.shareToken ?? null,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: { existing?: WishlistEntity | null } = {}) {
  const wishlists: jest.Mocked<WishlistRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(options.existing === undefined ? buildWishlist() : options.existing),
    findDefaultByCustomerId: jest.fn(),
    findByShareToken: jest.fn(),
    create: jest.fn(),
    setShareToken: jest
      .fn()
      .mockImplementation(async (id: string, token: string) =>
        buildWishlist({ shareToken: token }),
      ),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new ShareWishlistUseCase(wishlists, auditLog), wishlists, auditLog };
}

describe('ShareWishlistUseCase', () => {
  it('generates a new share token when the wishlist has none yet', async () => {
    const { useCase, wishlists } = buildUseCase();

    const result = await useCase.execute({ wishlistId: 'wishlist-1', customerId: 'customer-1' });

    expect(wishlists.setShareToken).toHaveBeenCalledWith('wishlist-1', expect.any(String));
    expect(result.shareToken).toBeTruthy();
  });

  it('reuses the existing share token instead of generating a new one', async () => {
    const existing = buildWishlist({ shareToken: 'already-shared-token' });
    const { useCase, wishlists } = buildUseCase({ existing });

    const result = await useCase.execute({ wishlistId: 'wishlist-1', customerId: 'customer-1' });

    expect(wishlists.setShareToken).not.toHaveBeenCalled();
    expect(result.shareToken).toBe('already-shared-token');
  });

  it('records an audit log entry only when a new token is generated', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute({ wishlistId: 'wishlist-1', customerId: 'customer-1' });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'wishlist.shared' }),
    );
  });
});
