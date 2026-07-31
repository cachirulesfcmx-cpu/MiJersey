import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseFilters,
} from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { AddWishlistItemUseCase } from '../../application/use-cases/add-wishlist-item.use-case';
import { BuildWishlistViewUseCase } from '../../application/use-cases/build-wishlist-view.use-case';
import { GetOrCreateWishlistUseCase } from '../../application/use-cases/get-or-create-wishlist.use-case';
import { MoveWishlistItemToCartUseCase } from '../../application/use-cases/move-wishlist-item-to-cart.use-case';
import { RemoveWishlistItemUseCase } from '../../application/use-cases/remove-wishlist-item.use-case';
import { ShareWishlistUseCase } from '../../application/use-cases/share-wishlist.use-case';
import { AddWishlistItemDto } from '../dto/add-wishlist-item.dto';
import { WishlistExceptionFilter } from '../filters/wishlist-exception.filter';

function requireSessionId(sessionId: string | undefined): string {
  if (!sessionId) {
    throw new BadRequestException('Falta el encabezado x-session-id');
  }
  return sessionId;
}

/** Spec §9 "autenticación obligatoria" — a diferencia de Cart/Checkout, aquí no hay modo invitado; se usa el guard global `JwtAuthGuard` (sin `@Public()`) igual que `/me` en 019. Solo se opera sobre la wishlist predeterminada del cliente (spec §7 no expone gestión de varias listas). */
@Controller('wishlist')
@UseFilters(WishlistExceptionFilter)
export class WishlistController {
  constructor(
    private readonly getOrCreateWishlist: GetOrCreateWishlistUseCase,
    private readonly addItem: AddWishlistItemUseCase,
    private readonly removeItem: RemoveWishlistItemUseCase,
    private readonly moveToCart: MoveWishlistItemToCartUseCase,
    private readonly shareWishlist: ShareWishlistUseCase,
    private readonly buildView: BuildWishlistViewUseCase,
  ) {}

  @Get()
  async get(@CurrentUser() user: AccessTokenPayload) {
    const wishlist = await this.getOrCreateWishlist.execute(user.sub);
    return this.buildView.execute(wishlist);
  }

  @Post('items')
  async addWishlistItem(@CurrentUser() user: AccessTokenPayload, @Body() dto: AddWishlistItemDto) {
    const wishlist = await this.getOrCreateWishlist.execute(user.sub);
    const updated = await this.addItem.execute({
      wishlistId: wishlist.id,
      productId: dto.productId,
      variantId: dto.variantId,
    });
    return this.buildView.execute(updated);
  }

  @Delete('items/:id')
  async removeWishlistItem(@CurrentUser() user: AccessTokenPayload, @Param('id') itemId: string) {
    const wishlist = await this.getOrCreateWishlist.execute(user.sub);
    await this.removeItem.execute({ wishlistId: wishlist.id, itemId, customerId: user.sub });
    const refreshed = await this.getOrCreateWishlist.execute(user.sub);
    return this.buildView.execute(refreshed);
  }

  @Post('items/:id/move-to-cart')
  @HttpCode(HttpStatus.OK)
  async moveItemToCart(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') itemId: string,
    @Headers('x-session-id') sessionIdHeader: string | undefined,
  ) {
    const sessionId = requireSessionId(sessionIdHeader);
    const wishlist = await this.getOrCreateWishlist.execute(user.sub);
    await this.moveToCart.execute({
      wishlistId: wishlist.id,
      itemId,
      customerId: user.sub,
      sessionId,
    });
    const refreshed = await this.getOrCreateWishlist.execute(user.sub);
    return this.buildView.execute(refreshed);
  }

  @Post('share')
  @HttpCode(HttpStatus.OK)
  async share(@CurrentUser() user: AccessTokenPayload) {
    const wishlist = await this.getOrCreateWishlist.execute(user.sub);
    const shared = await this.shareWishlist.execute({
      wishlistId: wishlist.id,
      customerId: user.sub,
    });
    return { shareToken: shared.shareToken };
  }
}
