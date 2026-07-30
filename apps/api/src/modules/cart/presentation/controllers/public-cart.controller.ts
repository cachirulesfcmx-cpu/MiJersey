import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { AddCartItemUseCase } from '../../application/use-cases/add-cart-item.use-case';
import { ApplyCouponUseCase } from '../../application/use-cases/apply-coupon.use-case';
import { BuildCartViewUseCase } from '../../application/use-cases/build-cart-view.use-case';
import { GetOrCreateCartUseCase } from '../../application/use-cases/get-or-create-cart.use-case';
import { MergeCartUseCase } from '../../application/use-cases/merge-cart.use-case';
import { RemoveCartItemUseCase } from '../../application/use-cases/remove-cart-item.use-case';
import { RemoveCouponUseCase } from '../../application/use-cases/remove-coupon.use-case';
import { UpdateCartItemUseCase } from '../../application/use-cases/update-cart-item.use-case';
import { CurrentUserOptional } from '../decorators/current-user-optional.decorator';
import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { ApplyCouponDto } from '../dto/apply-coupon.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';
import { CartExceptionFilter } from '../filters/cart-exception.filter';
import { OptionalAuthGuard } from '../guards/optional-auth.guard';

function requireSessionId(sessionId: string | undefined): string {
  if (!sessionId) {
    throw new BadRequestException('Falta el encabezado x-session-id');
  }
  return sessionId;
}

/** Funciona para invitados (identificados por `x-session-id`) y clientes (JWT opcional vía `OptionalAuthGuard`) por igual — spec §2 "carrito para invitados y clientes". */
@Controller('cart')
@Public()
@UseGuards(OptionalAuthGuard)
@UseFilters(CartExceptionFilter)
export class PublicCartController {
  constructor(
    private readonly getOrCreateCart: GetOrCreateCartUseCase,
    private readonly addItem: AddCartItemUseCase,
    private readonly updateItem: UpdateCartItemUseCase,
    private readonly removeItem: RemoveCartItemUseCase,
    private readonly applyCoupon: ApplyCouponUseCase,
    private readonly removeCoupon: RemoveCouponUseCase,
    private readonly mergeCart: MergeCartUseCase,
    private readonly buildView: BuildCartViewUseCase,
  ) {}

  @Get()
  async get(
    @Headers('x-session-id') sessionIdHeader: string | undefined,
    @CurrentUserOptional() user: AccessTokenPayload | undefined,
  ) {
    const sessionId = requireSessionId(sessionIdHeader);
    const cart = await this.getOrCreateCart.execute({ sessionId, customerId: user?.sub ?? null });
    return this.buildView.execute(cart);
  }

  @Post('items')
  async addCartItem(
    @Headers('x-session-id') sessionIdHeader: string | undefined,
    @CurrentUserOptional() user: AccessTokenPayload | undefined,
    @Body() dto: AddCartItemDto,
  ) {
    const sessionId = requireSessionId(sessionIdHeader);
    const cart = await this.getOrCreateCart.execute({ sessionId, customerId: user?.sub ?? null });
    const updated = await this.addItem.execute({
      cartId: cart.id,
      variantId: dto.variantId,
      quantity: dto.quantity,
    });
    return this.buildView.execute(updated);
  }

  @Patch('items/:id')
  async updateCartItem(
    @Headers('x-session-id') sessionIdHeader: string | undefined,
    @CurrentUserOptional() user: AccessTokenPayload | undefined,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const sessionId = requireSessionId(sessionIdHeader);
    const cart = await this.getOrCreateCart.execute({ sessionId, customerId: user?.sub ?? null });
    const updated = await this.updateItem.execute({
      cartId: cart.id,
      itemId,
      quantity: dto.quantity,
    });
    return this.buildView.execute(updated);
  }

  @Delete('items/:id')
  async removeCartItem(
    @Headers('x-session-id') sessionIdHeader: string | undefined,
    @CurrentUserOptional() user: AccessTokenPayload | undefined,
    @Param('id') itemId: string,
  ) {
    const sessionId = requireSessionId(sessionIdHeader);
    const cart = await this.getOrCreateCart.execute({ sessionId, customerId: user?.sub ?? null });
    const updated = await this.removeItem.execute({ cartId: cart.id, itemId });
    return this.buildView.execute(updated);
  }

  @Post('coupon')
  async postCoupon(
    @Headers('x-session-id') sessionIdHeader: string | undefined,
    @CurrentUserOptional() user: AccessTokenPayload | undefined,
    @Body() dto: ApplyCouponDto,
  ) {
    const sessionId = requireSessionId(sessionIdHeader);
    const cart = await this.getOrCreateCart.execute({ sessionId, customerId: user?.sub ?? null });
    const updated = await this.applyCoupon.execute({ cartId: cart.id, code: dto.code, sessionId });
    return this.buildView.execute(updated);
  }

  @Delete('coupon')
  async deleteCoupon(
    @Headers('x-session-id') sessionIdHeader: string | undefined,
    @CurrentUserOptional() user: AccessTokenPayload | undefined,
  ) {
    const sessionId = requireSessionId(sessionIdHeader);
    const cart = await this.getOrCreateCart.execute({ sessionId, customerId: user?.sub ?? null });
    const updated = await this.removeCoupon.execute({ cartId: cart.id, sessionId });
    return this.buildView.execute(updated);
  }

  @Post('merge')
  async merge(
    @Headers('x-session-id') sessionIdHeader: string | undefined,
    @CurrentUserOptional() user: AccessTokenPayload | undefined,
  ) {
    const sessionId = requireSessionId(sessionIdHeader);
    if (!user) {
      throw new UnauthorizedException('Fusionar el carrito requiere haber iniciado sesión');
    }
    const merged = await this.mergeCart.execute({ sessionId, customerId: user.sub });
    return this.buildView.execute(merged);
  }
}
