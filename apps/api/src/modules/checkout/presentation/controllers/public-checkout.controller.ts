import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { CurrentUserOptional } from '../../../cart/presentation/decorators/current-user-optional.decorator';
import { CartExceptionFilter } from '../../../cart/presentation/filters/cart-exception.filter';
import { OptionalAuthGuard } from '../../../cart/presentation/guards/optional-auth.guard';
import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { BuildCheckoutViewUseCase } from '../../application/use-cases/build-checkout-view.use-case';
import { ConfirmCheckoutUseCase } from '../../application/use-cases/confirm-checkout.use-case';
import { GetOrCreateCheckoutUseCase } from '../../application/use-cases/get-or-create-checkout.use-case';
import { ListShippingMethodsUseCase } from '../../application/use-cases/list-shipping-methods.use-case';
import { ReviewCheckoutUseCase } from '../../application/use-cases/review-checkout.use-case';
import { SetCheckoutAddressUseCase } from '../../application/use-cases/set-checkout-address.use-case';
import { SetCheckoutShippingMethodUseCase } from '../../application/use-cases/set-checkout-shipping-method.use-case';
import { SetCheckoutAddressDto } from '../dto/set-checkout-address.dto';
import { SetCheckoutShippingDto } from '../dto/set-checkout-shipping.dto';
import { CheckoutExceptionFilter } from '../filters/checkout-exception.filter';

function requireSessionId(sessionId: string | undefined): string {
  if (!sessionId) {
    throw new BadRequestException('Falta el encabezado x-session-id');
  }
  return sessionId;
}

/** Funciona para invitados y clientes por igual (spec §3 "el sistema deberá permitir checkout como invitado"), mismo mecanismo que Cart: `x-session-id` + JWT opcional vía `OptionalAuthGuard` (reutilizado de Cart, no reimplementado). */
@Controller('checkout')
@Public()
@UseGuards(OptionalAuthGuard)
@UseFilters(CartExceptionFilter, CheckoutExceptionFilter)
export class PublicCheckoutController {
  constructor(
    private readonly getOrCreateCheckout: GetOrCreateCheckoutUseCase,
    private readonly setAddress: SetCheckoutAddressUseCase,
    private readonly setShippingMethod: SetCheckoutShippingMethodUseCase,
    private readonly reviewCheckout: ReviewCheckoutUseCase,
    private readonly confirmCheckout: ConfirmCheckoutUseCase,
    private readonly buildView: BuildCheckoutViewUseCase,
    private readonly listShippingMethods: ListShippingMethodsUseCase,
  ) {}

  @Get('shipping-methods')
  async getShippingMethods() {
    const items = await this.listShippingMethods.execute({ onlyActive: true });
    return { items: items.map((item) => item.toJSON()) };
  }

  @Get()
  async get(
    @Headers('x-session-id') sessionIdHeader: string | undefined,
    @CurrentUserOptional() user: AccessTokenPayload | undefined,
  ) {
    const sessionId = requireSessionId(sessionIdHeader);
    const session = await this.getOrCreateCheckout.execute({
      sessionId,
      customerId: user?.sub ?? null,
    });
    return this.buildView.execute(session);
  }

  @Post('address')
  async postAddress(
    @Headers('x-session-id') sessionIdHeader: string | undefined,
    @CurrentUserOptional() user: AccessTokenPayload | undefined,
    @Body() dto: SetCheckoutAddressDto,
  ) {
    const sessionId = requireSessionId(sessionIdHeader);
    const session = await this.getOrCreateCheckout.execute({
      sessionId,
      customerId: user?.sub ?? null,
    });
    const updated = await this.setAddress.execute({
      checkoutSessionId: session.id,
      contactEmail: dto.contactEmail,
      shipping: dto.shipping,
      ...(dto.billing ? { billing: dto.billing } : {}),
    });
    return this.buildView.execute(updated);
  }

  @Post('shipping')
  async postShipping(
    @Headers('x-session-id') sessionIdHeader: string | undefined,
    @CurrentUserOptional() user: AccessTokenPayload | undefined,
    @Body() dto: SetCheckoutShippingDto,
  ) {
    const sessionId = requireSessionId(sessionIdHeader);
    const session = await this.getOrCreateCheckout.execute({
      sessionId,
      customerId: user?.sub ?? null,
    });
    const updated = await this.setShippingMethod.execute({
      checkoutSessionId: session.id,
      shippingMethodId: dto.shippingMethodId,
    });
    return this.buildView.execute(updated);
  }

  @Post('review')
  async postReview(
    @Headers('x-session-id') sessionIdHeader: string | undefined,
    @CurrentUserOptional() user: AccessTokenPayload | undefined,
  ) {
    const sessionId = requireSessionId(sessionIdHeader);
    const session = await this.getOrCreateCheckout.execute({
      sessionId,
      customerId: user?.sub ?? null,
    });
    return this.reviewCheckout.execute({ checkoutSessionId: session.id });
  }

  @Post('confirm')
  async postConfirm(
    @Headers('x-session-id') sessionIdHeader: string | undefined,
    @CurrentUserOptional() user: AccessTokenPayload | undefined,
    @Ip() ip: string,
  ) {
    const sessionId = requireSessionId(sessionIdHeader);
    const session = await this.getOrCreateCheckout.execute({
      sessionId,
      customerId: user?.sub ?? null,
    });
    const order = await this.confirmCheckout.execute({
      checkoutSessionId: session.id,
      ipAddress: ip,
    });
    return { order: order.toJSON() };
  }
}
