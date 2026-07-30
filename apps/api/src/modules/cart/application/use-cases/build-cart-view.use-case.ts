import { Inject, Injectable } from '@nestjs/common';

import { MediaUsageService } from '../../../media/application/services/media-usage.service';
import {
  CART_INVENTORY_AVAILABILITY,
  CART_PRODUCT_LOOKUP,
  COUPON_REPOSITORY,
} from '../../cart.constants';
import type { CartEntity } from '../../domain/entities/cart.entity';
import type { CartInventoryAvailabilityPort } from '../../domain/ports/cart-inventory-availability.port';
import type { CartProductLookupPort } from '../../domain/ports/cart-product-lookup.port';
import type { CouponRepositoryPort } from '../../domain/ports/coupon.repository.port';
import type { CartItemView, CartView } from '../../domain/value-objects/cart-view';

/** Compone la respuesta pública de un carrito: enriquece cada línea con datos de producto/variante/disponibilidad (Catalog/Inventory, vía los puertos propios de Cart) y calcula subtotal/descuento/total en caliente — nunca se guardan estos totales en la base de datos. */
@Injectable()
export class BuildCartViewUseCase {
  constructor(
    @Inject(CART_PRODUCT_LOOKUP) private readonly productLookup: CartProductLookupPort,
    @Inject(CART_INVENTORY_AVAILABILITY)
    private readonly availability: CartInventoryAvailabilityPort,
    @Inject(COUPON_REPOSITORY) private readonly coupons: CouponRepositoryPort,
    private readonly mediaUsage: MediaUsageService,
  ) {}

  async execute(cart: CartEntity): Promise<CartView> {
    const variantIds = cart.items.map((item) => item.variantId);

    const [variantInfoMap, availabilityMap, coupon] = await Promise.all([
      this.productLookup.findVariantInfoMany(variantIds),
      this.availability.getAvailabilityMany(variantIds),
      cart.couponCode ? this.coupons.findByCode(cart.couponCode) : Promise.resolve(null),
    ]);

    const imageIds = [...variantInfoMap.values()]
      .map((info) => info.imageId)
      .filter((id): id is string => !!id);
    const resolvedImages = await Promise.all(
      imageIds.map(async (id) => [id, await this.mediaUsage.resolveUrls(id)] as const),
    );
    const imageUrlById = new Map(
      resolvedImages.map(([id, resolved]) => [id, resolved?.url ?? null]),
    );

    const items: CartItemView[] = cart.items.map((item) => {
      const info = variantInfoMap.get(item.variantId);
      const availableQuantity = availabilityMap.get(item.variantId) ?? 0;

      return {
        id: item.id,
        productId: item.productId,
        productName: info?.productName ?? '',
        productSlug: info?.productSlug ?? '',
        variantId: item.variantId,
        variantTitle: info?.variantTitle ?? '',
        sku: item.sku,
        imageUrl: info?.imageId ? (imageUrlById.get(info.imageId) ?? null) : null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        availableQuantity,
        inStock: availableQuantity >= item.quantity,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const couponIsValid = !!coupon && coupon.isActive && !coupon.isExpired;
    const discount = couponIsValid ? coupon.computeDiscount(subtotal) : 0;

    return {
      id: cart.id,
      customerId: cart.customerId,
      sessionId: cart.sessionId,
      currency: cart.currency,
      status: cart.status,
      items,
      coupon: coupon
        ? { code: coupon.code, type: coupon.type, value: coupon.value, isValid: couponIsValid }
        : null,
      subtotal,
      discount,
      total: subtotal - discount,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}
