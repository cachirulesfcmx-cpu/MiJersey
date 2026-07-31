import { Inject, Injectable } from '@nestjs/common';

import { CART_REPOSITORY } from '../../../cart/cart.constants';
import type { CartRepositoryPort } from '../../../cart/domain/ports/cart.repository.port';
import { PRODUCT_VARIANT_REPOSITORY } from '../../../catalog/catalog.constants';
import type { ProductVariantRepositoryPort } from '../../../catalog/domain/ports/product-variant.repository.port';
import { CartNotFoundError } from '../../domain/errors/shipping.errors';
import type { CarrierRepositoryPort } from '../../domain/ports/carrier.repository.port';
import type { ShippingRateRepositoryPort } from '../../domain/ports/shipping-rate.repository.port';
import type { ShippingZoneRepositoryPort } from '../../domain/ports/shipping-zone.repository.port';
import { calculateRatePrice } from '../../domain/value-objects/shipping-rate-calculator.util';
import {
  CARRIER_REPOSITORY,
  DEFAULT_ITEM_WEIGHT_KG,
  SHIPPING_RATE_REPOSITORY,
  SHIPPING_ZONE_REPOSITORY,
} from '../../shipping.constants';

export interface CalculateShippingRatesInput {
  sessionId?: string;
  customerId?: string;
  country: string;
  state?: string;
}

export interface ShippingQuote {
  rateId: string;
  carrierId: string;
  carrierName: string;
  name: string;
  price: number;
  currency: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

/**
 * Motor de tarifas real (spec §4/§5): destino → zonas coincidentes → tarifas activas de esas
 * zonas → precio (`basePrice + pricePerKg * peso`, envío gratis sobre umbral). El peso total se
 * calcula sumando `ProductVariant.weight` de cada línea del carrito (`DEFAULT_ITEM_WEIGHT_KG`
 * cuando una variante no tiene peso capturado, para no romper el cálculo por datos incompletos
 * del catálogo).
 */
@Injectable()
export class CalculateShippingRatesUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepositoryPort,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variants: ProductVariantRepositoryPort,
    @Inject(SHIPPING_ZONE_REPOSITORY) private readonly zones: ShippingZoneRepositoryPort,
    @Inject(SHIPPING_RATE_REPOSITORY) private readonly rates: ShippingRateRepositoryPort,
    @Inject(CARRIER_REPOSITORY) private readonly carriers: CarrierRepositoryPort,
  ) {}

  async execute(input: CalculateShippingRatesInput): Promise<ShippingQuote[]> {
    const cart = input.customerId
      ? await this.carts.findActiveByCustomerId(input.customerId)
      : input.sessionId
        ? await this.carts.findActiveBySessionId(input.sessionId)
        : null;
    if (!cart) throw new CartNotFoundError();

    let totalWeightKg = 0;
    for (const item of cart.items) {
      const variant = await this.variants.findById(item.variantId);
      totalWeightKg += (variant?.weight ?? DEFAULT_ITEM_WEIGHT_KG) * item.quantity;
    }

    const allZones = await this.zones.findMany();
    const matchingZoneIds = new Set(
      allZones
        .filter((zone) => zone.matches(input.country, input.state ?? null))
        .map((zone) => zone.id),
    );

    const activeCarriers = await this.carriers.findActive();
    const carrierById = new Map(activeCarriers.map((carrier) => [carrier.id, carrier]));

    const activeRates = await this.rates.findActive();
    const quotes: ShippingQuote[] = [];
    for (const rate of activeRates) {
      if (!matchingZoneIds.has(rate.zoneId)) continue;
      const carrier = carrierById.get(rate.carrierId);
      if (!carrier) continue;

      const price = calculateRatePrice({
        basePrice: rate.basePrice,
        pricePerKg: rate.pricePerKg,
        freeShippingThreshold: rate.freeShippingThreshold,
        totalWeightKg,
        cartSubtotal: cart.subtotal,
      });

      quotes.push({
        rateId: rate.id,
        carrierId: carrier.id,
        carrierName: carrier.toJSON().name,
        name: rate.toJSON().name,
        price,
        currency: cart.currency,
        estimatedDaysMin: rate.estimatedDaysMin,
        estimatedDaysMax: rate.estimatedDaysMax,
      });
    }

    return quotes.sort((a, b) => a.price - b.price);
  }
}
