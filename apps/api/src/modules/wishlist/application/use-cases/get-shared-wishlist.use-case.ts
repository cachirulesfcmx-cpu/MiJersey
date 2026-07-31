import { Inject, Injectable } from '@nestjs/common';

import { SharedWishlistNotFoundError } from '../../domain/errors/wishlist.errors';
import type { WishlistRepositoryPort } from '../../domain/ports/wishlist.repository.port';
import type { WishlistView } from '../../domain/value-objects/wishlist-view';
import { WISHLIST_REPOSITORY } from '../../wishlist.constants';
import { BuildWishlistViewUseCase } from './build-wishlist-view.use-case';

/** Público a propósito (endpoint sin autenticación) — el token en sí es la autorización (spec §9 "validación de enlaces compartidos"), no requiere que quien lo abre tenga cuenta. */
@Injectable()
export class GetSharedWishlistUseCase {
  constructor(
    @Inject(WISHLIST_REPOSITORY) private readonly wishlists: WishlistRepositoryPort,
    private readonly buildView: BuildWishlistViewUseCase,
  ) {}

  async execute(token: string): Promise<WishlistView> {
    const wishlist = await this.wishlists.findByShareToken(token);
    if (!wishlist) throw new SharedWishlistNotFoundError();

    return this.buildView.execute(wishlist);
  }
}
