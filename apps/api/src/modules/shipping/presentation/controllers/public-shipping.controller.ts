import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { CurrentUserOptional } from '../../../cart/presentation/decorators/current-user-optional.decorator';
import { CartExceptionFilter } from '../../../cart/presentation/filters/cart-exception.filter';
import { OptionalAuthGuard } from '../../../cart/presentation/guards/optional-auth.guard';
import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CalculateShippingRatesUseCase } from '../../application/use-cases/calculate-shipping-rates.use-case';
import { ListCarriersUseCase } from '../../application/use-cases/list-carriers.use-case';
import { ListRatesUseCase } from '../../application/use-cases/list-rates.use-case';
import { TrackShipmentUseCase } from '../../application/use-cases/track-shipment.use-case';
import { CalculateRatesDto } from '../dto/calculate-rates.dto';
import { ShippingExceptionFilter } from '../filters/shipping-exception.filter';

function requireSessionId(sessionId: string | undefined): string {
  if (!sessionId) {
    throw new BadRequestException('Falta el encabezado x-session-id');
  }
  return sessionId;
}

/** Funciona para invitados y clientes por igual, mismo mecanismo que Checkout (018): `x-session-id` + JWT opcional vía `OptionalAuthGuard` (reutilizado de Cart, no reimplementado). */
@Controller('shipping')
@Public()
@UseGuards(OptionalAuthGuard)
@UseFilters(CartExceptionFilter, ShippingExceptionFilter)
export class PublicShippingController {
  constructor(
    private readonly listRates: ListRatesUseCase,
    private readonly listCarriers: ListCarriersUseCase,
    private readonly calculateRates: CalculateShippingRatesUseCase,
    private readonly trackShipment: TrackShipmentUseCase,
  ) {}

  /** Listado genérico de tarifas configuradas (spec §7), sin destino — para explorar opciones antes de tener un carrito con dirección. El cálculo real por destino/peso es `POST /shipping/rates`. */
  @Get('methods')
  async getMethods() {
    const [rates, carriers] = await Promise.all([
      this.listRates.execute(),
      this.listCarriers.execute({ onlyActive: true }),
    ]);
    const carrierById = new Map(carriers.map((carrier) => [carrier.id, carrier]));

    const items = rates
      .filter((rate) => rate.isActive && carrierById.has(rate.carrierId))
      .map((rate) => ({
        ...rate.toJSON(),
        carrierName: carrierById.get(rate.carrierId)?.toJSON().name ?? null,
      }));

    return { items };
  }

  @Post('rates')
  async postRates(
    @Headers('x-session-id') sessionIdHeader: string | undefined,
    @CurrentUserOptional() user: AccessTokenPayload | undefined,
    @Body() dto: CalculateRatesDto,
  ) {
    const sessionId = requireSessionId(sessionIdHeader);
    const quotes = await this.calculateRates.execute({
      sessionId,
      ...(user?.sub ? { customerId: user.sub } : {}),
      country: dto.country,
      ...(dto.state !== undefined ? { state: dto.state } : {}),
    });
    return { items: quotes };
  }

  @Get('track/:trackingNumber')
  async track(@Param('trackingNumber') trackingNumber: string) {
    const { shipment, events } = await this.trackShipment.execute(trackingNumber);
    return {
      shipment: shipment.toJSON(),
      events: events.map((event) => event.toJSON()),
    };
  }
}
