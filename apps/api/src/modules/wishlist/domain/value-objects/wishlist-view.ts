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
  createdAt: Date;
}

export interface WishlistView {
  id: string;
  name: string;
  shareToken: string | null;
  items: WishlistItemView[];
  createdAt: Date;
  updatedAt: Date;
}
