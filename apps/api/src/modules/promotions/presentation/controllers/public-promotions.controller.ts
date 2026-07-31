import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { CurrentUserOptional } from '../../../cart/presentation/decorators/current-user-optional.decorator';
import { CartExceptionFilter } from '../../../cart/presentation/filters/cart-exception.filter';
import { OptionalAuthGuard } from '../../../cart/presentation/guards/optional-auth.guard';
import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { ListActivePromotionsUseCase } from '../../application/use-cases/list-active-promotions.use-case';
import { RecordPromotionUsageUseCase } from '../../application/use-cases/record-promotion-usage.use-case';
import { ValidatePromotionUseCase } from '../../application/use-cases/validate-promotion.use-case';
import { RecordUsageDto } from '../dto/record-usage.dto';
import { ValidatePromotionDto } from '../dto/validate-promotion.dto';
import { PromotionsExceptionFilter } from '../filters/promotions-exception.filter';

function requireSessionId(sessionId: string | undefined): string {
  if (!sessionId) {
    throw new BadRequestException('Falta el encabezado x-session-id');
  }
  return sessionId;
}

/** Funciona para invitados y clientes por igual — mismo mecanismo que Cart/Checkout/Shipping: `x-session-id` + JWT opcional vía `OptionalAuthGuard`. */
@Controller('promotions')
@Public()
@UseGuards(OptionalAuthGuard)
@UseFilters(CartExceptionFilter, PromotionsExceptionFilter)
export class PublicPromotionsController {
  constructor(
    private readonly listActivePromotions: ListActivePromotionsUseCase,
    private readonly validatePromotion: ValidatePromotionUseCase,
    private readonly recordPromotionUsage: RecordPromotionUsageUseCase,
  ) {}

  /** Promotion Banner (spec §6). */
  @Get()
  async list() {
    const items = await this.listActivePromotions.execute();
    return { items: items.map((item) => item.toJSON()) };
  }

  @Post('validate')
  async validate(
    @Headers('x-session-id') sessionIdHeader: string | undefined,
    @CurrentUserOptional() user: AccessTokenPayload | undefined,
    @Body() dto: ValidatePromotionDto,
  ) {
    const sessionId = requireSessionId(sessionIdHeader);
    const result = await this.validatePromotion.execute({
      sessionId,
      ...(user?.sub ? { customerId: user.sub } : {}),
      ...(dto.code ? { code: dto.code } : {}),
    });
    return {
      applicable: result.applicable.map((promotion) => promotion.toJSON()),
      discountTotal: result.discountTotal,
      currency: result.currency,
    };
  }

  /** Disparado por el storefront tras `POST /checkout/confirm` (021) — ver comentario en `RecordPromotionUsageUseCase`. */
  @Post('record-usage')
  async recordUsage(@Body() dto: RecordUsageDto) {
    const usage = await this.recordPromotionUsage.execute({ orderId: dto.orderId });
    return { usage: usage?.toJSON() ?? null };
  }
}
