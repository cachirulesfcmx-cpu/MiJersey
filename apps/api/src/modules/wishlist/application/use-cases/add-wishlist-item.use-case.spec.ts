import { WishlistEntity } from '../../domain/entities/wishlist.entity';
import { WishlistItemEntity } from '../../domain/entities/wishlist-item.entity';
import {
  DuplicateWishlistItemError,
  ProductNotFoundError,
} from '../../domain/errors/wishlist.errors';
import type { WishlistRepositoryPort } from '../../domain/ports/wishlist.repository.port';
import type {
  CreateWishlistItemData,
  WishlistItemRepositoryPort,
} from '../../domain/ports/wishlist-item.repository.port';
import type {
  WishlistProductLookupPort,
  WishlistVariantInfo,
} from '../../domain/ports/wishlist-product-lookup.port';
import { AddWishlistItemUseCase } from './add-wishlist-item.use-case';

function buildVariantInfo(overrides: Partial<WishlistVariantInfo> = {}): WishlistVariantInfo {
  return {
    productName: 'Playera',
    productSlug: 'playera',
    variantTitle: 'M / Azul',
    sku: 'SKU-1',
    price: 299,
    imageId: null,
    isAvailableForSale: true,
    ...overrides,
  };
}

function buildWishlist(items: WishlistItemEntity[] = []): WishlistEntity {
  return new WishlistEntity({
    id: 'wishlist-1',
    customerId: 'customer-1',
    name: 'Mi lista de deseos',
    isDefault: true,
    shareToken: null,
    items,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildInput(overrides: Partial<{ variantId: string; productId: string }> = {}) {
  return {
    wishlistId: 'wishlist-1',
    productId: overrides.productId ?? 'product-1',
    variantId: overrides.variantId ?? 'variant-1',
  };
}

function buildUseCase(
  options: {
    variantInfo?: WishlistVariantInfo | null;
    existingItem?: WishlistItemEntity | null;
  } = {},
) {
  const items: jest.Mocked<WishlistItemRepositoryPort> = {
    findById: jest.fn(),
    findByWishlistAndVariant: jest.fn().mockResolvedValue(options.existingItem ?? null),
    create: jest
      .fn()
      .mockImplementation(
        async (data: CreateWishlistItemData) =>
          new WishlistItemEntity({ id: 'item-1', ...data, createdAt: new Date() }),
      ),
    delete: jest.fn(),
  };
  const productLookup: jest.Mocked<WishlistProductLookupPort> = {
    findVariantInfo: jest
      .fn()
      .mockResolvedValue(
        options.variantInfo === undefined ? buildVariantInfo() : options.variantInfo,
      ),
    findVariantInfoMany: jest.fn(),
  };
  const wishlists: jest.Mocked<WishlistRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(buildWishlist()),
    findDefaultByCustomerId: jest.fn(),
    findByShareToken: jest.fn(),
    create: jest.fn(),
    setShareToken: jest.fn(),
  };

  return {
    useCase: new AddWishlistItemUseCase(items, productLookup, wishlists),
    items,
    productLookup,
    wishlists,
  };
}

describe('AddWishlistItemUseCase', () => {
  it('throws ProductNotFoundError when the variant does not exist', async () => {
    const { useCase } = buildUseCase({ variantInfo: null });

    await expect(useCase.execute(buildInput())).rejects.toThrow(ProductNotFoundError);
  });

  it('throws DuplicateWishlistItemError when the variant is already in the wishlist', async () => {
    const existing = new WishlistItemEntity({
      id: 'item-existing',
      wishlistId: 'wishlist-1',
      productId: 'product-1',
      variantId: 'variant-1',
      createdAt: new Date(),
    });
    const { useCase } = buildUseCase({ existingItem: existing });

    await expect(useCase.execute(buildInput())).rejects.toThrow(DuplicateWishlistItemError);
  });

  it('creates the item and returns the refreshed wishlist when the variant is new', async () => {
    const { useCase, items } = buildUseCase();

    const result = await useCase.execute(buildInput());

    expect(items.create).toHaveBeenCalledWith({
      wishlistId: 'wishlist-1',
      productId: 'product-1',
      variantId: 'variant-1',
    });
    expect(result.id).toBe('wishlist-1');
  });
});
