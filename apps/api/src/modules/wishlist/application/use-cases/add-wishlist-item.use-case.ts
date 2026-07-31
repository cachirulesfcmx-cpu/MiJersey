import { Inject, Injectable } from '@nestjs/common';

import type { WishlistEntity } from '../../domain/entities/wishlist.entity';
import {
  DuplicateWishlistItemError,
  ProductNotFoundError,
} from '../../domain/errors/wishlist.errors';
import type { WishlistRepositoryPort } from '../../domain/ports/wishlist.repository.port';
import type { WishlistItemRepositoryPort } from '../../domain/ports/wishlist-item.repository.port';
import type { WishlistProductLookupPort } from '../../domain/ports/wishlist-product-lookup.port';
import {
  WISHLIST_ITEM_REPOSITORY,
  WISHLIST_PRODUCT_LOOKUP,
  WISHLIST_REPOSITORY,
} from '../../wishlist.constants';

export interface AddWishlistItemInput {
  wishlistId: string;
  productId: string;
  variantId: string;
}

/** "No permitir elementos duplicados en la misma lista" (spec §4) — se valida antes de insertar, además de la constraint única en base de datos, para devolver un error de dominio claro en vez de un error crudo de Postgres. */
@Injectable()
export class AddWishlistItemUseCase {
  constructor(
    @Inject(WISHLIST_ITEM_REPOSITORY) private readonly items: WishlistItemRepositoryPort,
    @Inject(WISHLIST_PRODUCT_LOOKUP) private readonly productLookup: WishlistProductLookupPort,
    @Inject(WISHLIST_REPOSITORY) private readonly wishlists: WishlistRepositoryPort,
  ) {}

  async execute(input: AddWishlistItemInput): Promise<WishlistEntity> {
    const variantInfo = await this.productLookup.findVariantInfo(input.variantId);
    if (!variantInfo) throw new ProductNotFoundError();

    const existing = await this.items.findByWishlistAndVariant(input.wishlistId, input.variantId);
    if (existing) throw new DuplicateWishlistItemError();

    await this.items.create({
      wishlistId: input.wishlistId,
      productId: input.productId,
      variantId: input.variantId,
    });

    const updated = await this.wishlists.findById(input.wishlistId);
    if (!updated) throw new ProductNotFoundError();
    return updated;
  }
}
