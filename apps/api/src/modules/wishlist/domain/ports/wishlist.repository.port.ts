import type { WishlistEntity } from '../entities/wishlist.entity';

export interface CreateWishlistData {
  customerId: string;
  name?: string;
  isDefault?: boolean;
}

export interface WishlistRepositoryPort {
  findById(id: string): Promise<WishlistEntity | null>;
  findDefaultByCustomerId(customerId: string): Promise<WishlistEntity | null>;
  findByShareToken(token: string): Promise<WishlistEntity | null>;
  create(data: CreateWishlistData): Promise<WishlistEntity>;
  setShareToken(id: string, token: string): Promise<WishlistEntity>;
}
