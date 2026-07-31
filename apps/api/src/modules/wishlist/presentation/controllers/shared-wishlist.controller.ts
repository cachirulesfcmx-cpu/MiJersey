import { Controller, Get, Param, UseFilters } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { GetSharedWishlistUseCase } from '../../application/use-cases/get-shared-wishlist.use-case';
import { WishlistExceptionFilter } from '../filters/wishlist-exception.filter';

/** Endpoint público añadido más allá de la lista mínima de la spec §7 — necesario para que "compartir mediante enlace" (spec §2) sea utilizable por alguien sin cuenta, mismo criterio que `GET /checkout/shipping-methods` (018) y `DELETE /cart/coupon` (017). */
@Controller('wishlist/shared')
@Public()
@UseFilters(WishlistExceptionFilter)
export class SharedWishlistController {
  constructor(private readonly getSharedWishlist: GetSharedWishlistUseCase) {}

  @Get(':token')
  async get(@Param('token') token: string) {
    return this.getSharedWishlist.execute(token);
  }
}
