/** Lectura propia de Checkout sobre las tablas físicas de Catalog — mismo patrón CQRS del resto de la sesión (Cart 017 `CartProductLookupPort`). Usada exclusivamente en `ConfirmCheckoutUseCase` para congelar el precio vigente al momento de crear la orden: `CartItem.unitPrice` es una foto que puede haber quedado desactualizada (ver comentario en `schema.prisma` sobre `CartItem`), así que Checkout hace su propia relectura en vez de confiar en el valor guardado del carrito. */
export interface CheckoutVariantInfo {
  price: number;
  isAvailableForSale: boolean;
}

export interface CheckoutProductLookupPort {
  findVariantInfoMany(variantIds: string[]): Promise<Map<string, CheckoutVariantInfo>>;
}
