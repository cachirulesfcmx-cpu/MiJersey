import { CartEntity } from '../../../cart/domain/entities/cart.entity';
import { CartItemEntity } from '../../../cart/domain/entities/cart-item.entity';
import type { CartRepositoryPort } from '../../../cart/domain/ports/cart.repository.port';
import { CartStatus } from '../../../cart/domain/value-objects/cart-enums';
import { ProductVariantEntity } from '../../../catalog/domain/entities/product-variant.entity';
import type { ProductVariantRepositoryPort } from '../../../catalog/domain/ports/product-variant.repository.port';
import { ProductVariantStatus } from '../../../catalog/domain/value-objects/product-enums';
import { CarrierEntity } from '../../domain/entities/carrier.entity';
import { ShippingRateEntity } from '../../domain/entities/shipping-rate.entity';
import { ShippingZoneEntity } from '../../domain/entities/shipping-zone.entity';
import { CartNotFoundError } from '../../domain/errors/shipping.errors';
import type { CarrierRepositoryPort } from '../../domain/ports/carrier.repository.port';
import type { ShippingRateRepositoryPort } from '../../domain/ports/shipping-rate.repository.port';
import type { ShippingZoneRepositoryPort } from '../../domain/ports/shipping-zone.repository.port';
import { CalculateShippingRatesUseCase } from './calculate-shipping-rates.use-case';

function buildVariant(weight: number | null): ProductVariantEntity {
  return new ProductVariantEntity({
    id: 'v1',
    productId: 'p1',
    sku: 'SKU-1',
    barcode: null,
    slug: 'variant-1',
    title: 'Única',
    price: 100,
    compareAtPrice: null,
    weight,
    imageId: null,
    status: ProductVariantStatus.ACTIVE,
    optionValueIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildCart(): CartEntity {
  return new CartEntity({
    id: 'cart-1',
    customerId: null,
    sessionId: 'session-1',
    currency: 'MXN',
    status: CartStatus.ACTIVE,
    couponCode: null,
    items: [
      new CartItemEntity({
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'p1',
        variantId: 'v1',
        sku: 'SKU-1',
        quantity: 3,
        unitPrice: 100,
        subtotal: 300,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildZone(countries: string[]): ShippingZoneEntity {
  return new ShippingZoneEntity({
    id: 'zone-1',
    name: 'México',
    countries,
    states: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildRate(
  overrides: Partial<{ isActive: boolean; freeShippingThreshold: number | null }> = {},
): ShippingRateEntity {
  return new ShippingRateEntity({
    id: 'rate-1',
    carrierId: 'carrier-1',
    zoneId: 'zone-1',
    name: 'Estándar',
    basePrice: 50,
    pricePerKg: 10,
    freeShippingThreshold: overrides.freeShippingThreshold ?? null,
    estimatedDaysMin: 3,
    estimatedDaysMax: 5,
    isActive: overrides.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildCarrier(): CarrierEntity {
  return new CarrierEntity({
    id: 'carrier-1',
    name: 'Reparto propio',
    code: 'MANUAL',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(
  options: {
    cart?: CartEntity | null;
    variantWeight?: number | null;
    zones?: ShippingZoneEntity[];
    rates?: ShippingRateEntity[];
  } = {},
) {
  const carts: jest.Mocked<CartRepositoryPort> = {
    findById: jest.fn(),
    findActiveBySessionId: jest
      .fn()
      .mockResolvedValue(options.cart === undefined ? buildCart() : options.cart),
    findActiveByCustomerId: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    attachCustomer: jest.fn(),
    updateStatus: jest.fn(),
    setCoupon: jest.fn(),
  };
  const variants: jest.Mocked<ProductVariantRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(
        buildVariant(options.variantWeight === undefined ? 2 : options.variantWeight),
      ),
    existsBySku: jest.fn(),
    existsBySlug: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findManyPublic: jest.fn(),
    bulkUpdate: jest.fn(),
    existingCombinationKeys: jest.fn(),
  };
  const zones: jest.Mocked<ShippingZoneRepositoryPort> = {
    findById: jest.fn(),
    findMany: jest.fn().mockResolvedValue(options.zones ?? [buildZone(['MX'])]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const rates: jest.Mocked<ShippingRateRepositoryPort> = {
    findById: jest.fn(),
    findMany: jest.fn(),
    findActive: jest.fn().mockResolvedValue(options.rates ?? [buildRate()]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const carriers: jest.Mocked<CarrierRepositoryPort> = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    findActive: jest.fn().mockResolvedValue([buildCarrier()]),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  return {
    useCase: new CalculateShippingRatesUseCase(carts, variants, zones, rates, carriers),
    carts,
    variants,
    zones,
    rates,
    carriers,
  };
}

describe('CalculateShippingRatesUseCase', () => {
  it('throws CartNotFoundError when there is no active cart for the session', async () => {
    const { useCase } = buildUseCase({ cart: null });

    await expect(useCase.execute({ sessionId: 'session-1', country: 'MX' })).rejects.toThrow(
      CartNotFoundError,
    );
  });

  it('computes the price using the variant weight times quantity', async () => {
    const { useCase } = buildUseCase({ variantWeight: 2 });

    const quotes = await useCase.execute({ sessionId: 'session-1', country: 'MX' });

    expect(quotes).toHaveLength(1);
    expect(quotes[0]).toMatchObject({ price: 50 + 10 * (2 * 3), carrierId: 'carrier-1' });
  });

  it('falls back to the default weight when the variant has none captured', async () => {
    const { useCase } = buildUseCase({ variantWeight: null });

    const quotes = await useCase.execute({ sessionId: 'session-1', country: 'MX' });

    expect(quotes[0]?.price).toBe(50 + 10 * (0.5 * 3));
  });

  it('excludes rates whose zone does not match the destination country', async () => {
    const { useCase } = buildUseCase({ zones: [buildZone(['US'])] });

    const quotes = await useCase.execute({ sessionId: 'session-1', country: 'MX' });

    expect(quotes).toHaveLength(0);
  });

  it('sorts quotes by price ascending', async () => {
    const { useCase } = buildUseCase({
      rates: [
        buildRate({ freeShippingThreshold: null }),
        new ShippingRateEntity({
          id: 'rate-2',
          carrierId: 'carrier-1',
          zoneId: 'zone-1',
          name: 'Exprés',
          basePrice: 20,
          pricePerKg: 5,
          freeShippingThreshold: null,
          estimatedDaysMin: 1,
          estimatedDaysMax: 2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ],
    });

    const quotes = await useCase.execute({ sessionId: 'session-1', country: 'MX' });

    expect(quotes.map((quote) => quote.rateId)).toEqual(['rate-2', 'rate-1']);
  });
});
