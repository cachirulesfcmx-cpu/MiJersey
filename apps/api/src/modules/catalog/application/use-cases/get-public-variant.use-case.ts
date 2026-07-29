import { Inject, Injectable } from '@nestjs/common';

import { MediaUsageService } from '../../../media/application/services/media-usage.service';
import {
  INVENTORY_AVAILABILITY,
  PRODUCT_REPOSITORY,
  PRODUCT_VARIANT_REPOSITORY,
} from '../../catalog.constants';
import { ProductVariantNotFoundError } from '../../domain/errors/catalog.errors';
import type { InventoryAvailabilityPort } from '../../domain/ports/inventory-availability.port';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type { ProductVariantRepositoryPort } from '../../domain/ports/product-variant.repository.port';
import {
  ProductStatus,
  ProductVariantStatus,
  ProductVisibility,
} from '../../domain/value-objects/product-enums';
import type { PublicVariantView } from '../../domain/value-objects/public-product-view';

/** `GET /variants/:id` (015) — usado por la PDP para refrescar una variante puntual sin recargar todo el producto. */
@Injectable()
export class GetPublicVariantUseCase {
  constructor(
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variants: ProductVariantRepositoryPort,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(INVENTORY_AVAILABILITY) private readonly availability: InventoryAvailabilityPort,
    private readonly mediaUsage: MediaUsageService,
  ) {}

  async execute(id: string): Promise<PublicVariantView> {
    const variant = await this.variants.findById(id);
    if (!variant || variant.status !== ProductVariantStatus.ACTIVE) {
      throw new ProductVariantNotFoundError();
    }

    const product = await this.products.findById(variant.productId);
    if (
      !product ||
      product.status !== ProductStatus.ACTIVE ||
      product.visibility !== ProductVisibility.PUBLIC
    ) {
      throw new ProductVariantNotFoundError();
    }

    const [availabilityMap, resolvedImage] = await Promise.all([
      this.availability.getAvailability([variant.id]),
      variant.imageId ? this.mediaUsage.resolveUrls(variant.imageId) : null,
    ]);

    const availableQuantity = availabilityMap.get(variant.id) ?? 0;

    return {
      id: variant.id,
      sku: variant.sku,
      slug: variant.slug,
      title: variant.title,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      imageUrl: resolvedImage?.url ?? null,
      optionValueIds: variant.optionValueIds,
      availableQuantity,
      inStock: availableQuantity > 0,
    };
  }
}
