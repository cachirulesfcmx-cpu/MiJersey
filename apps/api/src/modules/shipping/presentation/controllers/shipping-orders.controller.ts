import { Controller, Get, Param, UseFilters } from '@nestjs/common';

import type { AccessTokenPayload } from '../../../identity/domain/ports/token.service.port';
import { CurrentUser } from '../../../identity/presentation/decorators/current-user.decorator';
import { GetShipmentByOrderUseCase } from '../../application/use-cases/get-shipment-by-order.use-case';
import { ShippingExceptionFilter } from '../filters/shipping-exception.filter';

/** JWT obligatorio (sin `@Public()`) — a diferencia de `PublicShippingController`, aquí sí hay verificación de propiedad vía `GetShipmentByOrderUseCase` (reutiliza `GetOrderUseCase` de 021). */
@Controller('shipping/orders')
@UseFilters(ShippingExceptionFilter)
export class ShippingOrdersController {
  constructor(private readonly getShipmentByOrder: GetShipmentByOrderUseCase) {}

  @Get(':orderId')
  async get(@Param('orderId') orderId: string, @CurrentUser() user: AccessTokenPayload) {
    const shipment = await this.getShipmentByOrder.execute({ orderId, customerId: user.sub });
    return { shipment: shipment?.toJSON() ?? null };
  }
}
