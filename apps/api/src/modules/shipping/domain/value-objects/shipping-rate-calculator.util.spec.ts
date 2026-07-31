import { calculateRatePrice } from './shipping-rate-calculator.util';

describe('calculateRatePrice', () => {
  it('adds pricePerKg times the total weight to the base price', () => {
    const price = calculateRatePrice({
      basePrice: 50,
      pricePerKg: 10,
      freeShippingThreshold: null,
      totalWeightKg: 2.5,
      cartSubtotal: 300,
    });

    expect(price).toBe(75);
  });

  it('returns 0 when the cart subtotal reaches the free shipping threshold', () => {
    const price = calculateRatePrice({
      basePrice: 50,
      pricePerKg: 10,
      freeShippingThreshold: 500,
      totalWeightKg: 2,
      cartSubtotal: 500,
    });

    expect(price).toBe(0);
  });

  it('does not apply free shipping below the threshold', () => {
    const price = calculateRatePrice({
      basePrice: 50,
      pricePerKg: 10,
      freeShippingThreshold: 500,
      totalWeightKg: 2,
      cartSubtotal: 499.99,
    });

    expect(price).toBe(70);
  });
});
