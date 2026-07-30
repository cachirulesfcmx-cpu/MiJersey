/** Lectura propia de Cart sobre las tablas físicas de Catalog — mismo patrón CQRS de solo lectura del resto de la sesión (015 `ProductDetailLookupPort`, 016 `SearchLookupPort`), en vez de importar `CatalogModule`. */
export interface CartVariantInfo {
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantTitle: string;
  sku: string;
  price: number;
  imageId: string | null;
  /** `true` solo si el producto está ACTIVE+PUBLIC y la variante ACTIVE — la única condición para poder agregarla al carrito. */
  isAvailableForSale: boolean;
}

export interface CartProductLookupPort {
  findVariantInfo(variantId: string): Promise<CartVariantInfo | null>;
  findVariantInfoMany(variantIds: string[]): Promise<Map<string, CartVariantInfo>>;
}
