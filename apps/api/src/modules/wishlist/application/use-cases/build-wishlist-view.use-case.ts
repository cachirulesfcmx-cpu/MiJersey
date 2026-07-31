import { Inject, Injectable } from '@nestjs/common';

import { MediaUsageService } from '../../../media/application/services/media-usage.service';
import type { WishlistEntity } from '../../domain/entities/wishlist.entity';
import type { WishlistInventoryAvailabilityPort } from '../../domain/ports/wishlist-inventory-availability.port';
import type { WishlistProductLookupPort } from '../../domain/ports/wishlist-product-lookup.port';
import type { WishlistView } from '../../domain/value-objects/wishlist-view';
import { WISHLIST_INVENTORY_AVAILABILITY, WISHLIST_PRODUCT_LOOKUP } from '../../wishlist.constants';

/** Enriquece cada item con datos vigentes de producto/variante/disponibilidad — nada de esto se guarda en `WishlistItem`, que solo referencia ids (mismo criterio que Cart/Checkout: los totales y datos de presentación se calculan en caliente). */
@Injectable()
export class BuildWishlistViewUseCase {
  constructor(
    @Inject(WISHLIST_PRODUCT_LOOKUP) private readonly productLookup: WishlistProductLookupPort,
    @Inject(WISHLIST_INVENTORY_AVAILABILITY)
    private readonly availability: WishlistInventoryAvailabilityPort,
    private readonly mediaUsage: MediaUsageService,
  ) {}

  async execute(wishlist: WishlistEntity): Promise<WishlistView> {
    const variantIds = wishlist.items.map((item) => item.variantId);

    const [variantInfoMap, availabilityMap] = await Promise.all([
      this.productLookup.findVariantInfoMany(variantIds),
      this.availability.getAvailabilityMany(variantIds),
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

    const items = wishlist.items.map((item) => {
      const info = variantInfoMap.get(item.variantId);
      const availableQuantity = availabilityMap.get(item.variantId) ?? 0;

      return {
        id: item.id,
        productId: item.productId,
        productName: info?.productName ?? '',
        productSlug: info?.productSlug ?? '',
        variantId: item.variantId,
        variantTitle: info?.variantTitle ?? '',
        sku: info?.sku ?? '',
        imageUrl: info?.imageId ? (imageUrlById.get(info.imageId) ?? null) : null,
        price: info?.price ?? 0,
        // "Si un producto deja de existir, deberá marcarse como no disponible" (spec §4).
        isAvailable: info?.isAvailableForSale ?? false,
        availableQuantity,
        createdAt: item.toJSON().createdAt,
      };
    });

    const json = wishlist.toJSON();

    return {
      id: json.id,
      name: json.name,
      shareToken: json.shareToken,
      items,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    };
  }
}
