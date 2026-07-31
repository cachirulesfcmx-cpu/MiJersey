export interface RateCalculationInput {
  basePrice: number;
  pricePerKg: number;
  freeShippingThreshold: number | null;
  totalWeightKg: number;
  cartSubtotal: number;
}

/** Motor de cálculo (spec §4): `basePrice + pricePerKg * peso`, con envío gratis si `freeShippingThreshold` está definido y el subtotal del carrito lo alcanza. */
export function calculateRatePrice(input: RateCalculationInput): number {
  if (input.freeShippingThreshold !== null && input.cartSubtotal >= input.freeShippingThreshold) {
    return 0;
  }
  return input.basePrice + input.pricePerKg * input.totalWeightKg;
}
