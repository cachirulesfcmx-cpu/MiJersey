import type { WishlistItemEntity } from '../entities/wishlist-item.entity';

export interface CreateWishlistItemData {
  wishlistId: string;
  productId: string;
  variantId: string;
}

export interface WishlistItemRepositoryPort {
  findById(id: string): Promise<WishlistItemEntity | null>;
  findByWishlistAndVariant(
    wishlistId: string,
    variantId: string,
  ): Promise<WishlistItemEntity | null>;
  create(data: CreateWishlistItemData): Promise<WishlistItemEntity>;
  delete(id: string): Promise<void>;
}
