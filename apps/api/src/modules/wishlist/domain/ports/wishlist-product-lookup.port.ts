/** Lectura propia de Wishlist sobre las tablas físicas de Catalog — mismo patrón CQRS del resto de la sesión (Cart 017 `CartProductLookupPort`). `isAvailableForSale` es la base de "si un producto deja de existir, deberá marcarse como no disponible" (spec §4): no se borra el item, se marca en la vista. */
export interface WishlistVariantInfo {
  productName: string;
  productSlug: string;
  variantTitle: string;
  sku: string;
  price: number;
  imageId: string | null;
  isAvailableForSale: boolean;
}

export interface WishlistProductLookupPort {
  findVariantInfo(variantId: string): Promise<WishlistVariantInfo | null>;
  findVariantInfoMany(variantIds: string[]): Promise<Map<string, WishlistVariantInfo>>;
}
