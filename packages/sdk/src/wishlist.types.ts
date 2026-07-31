export interface WishlistItemView {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantTitle: string;
  sku: string;
  imageUrl: string | null;
  price: number;
  isAvailable: boolean;
  availableQuantity: number;
  createdAt: string;
}

export interface Wishlist {
  id: string;
  name: string;
  shareToken: string | null;
  items: WishlistItemView[];
  createdAt: string;
  updatedAt: string;
}

export interface AddWishlistItemInput {
  productId: string;
  variantId: string;
}
