import { Inject, Injectable } from '@nestjs/common';

import { GetOrderUseCase } from '../../../orders/application/use-cases/get-order.use-case';
import type { ShipmentEntity } from '../../domain/entities/shipment.entity';
import { OrderNotFoundError } from '../../domain/errors/shipping.errors';
import type { ShipmentRepositoryPort } from '../../domain/ports/shipment.repository.port';
import { SHIPMENT_REPOSITORY } from '../../shipping.constants';

export interface GetShipmentByOrderInput {
  orderId: string;
  customerId: string;
}

/** Reutiliza `GetOrderUseCase` (021) para la verificación de propiedad — mismo patrón cross-módulo que `GetPaymentUseCase` (022): el `OrderNotFoundError` de Orders se captura y se relanza como el propio de Shipping para que `ShippingExceptionFilter` (`@Catch(ShippingError)`) lo maneje. */
@Injectable()
export class GetShipmentByOrderUseCase {
  constructor(
    @Inject(SHIPMENT_REPOSITORY) private readonly shipments: ShipmentRepositoryPort,
    private readonly getOrder: GetOrderUseCase,
  ) {}

  async execute(input: GetShipmentByOrderInput): Promise<ShipmentEntity | null> {
    try {
      await this.getOrder.execute({ id: input.orderId, customerId: input.customerId });
    } catch {
      throw new OrderNotFoundError();
    }

    const shipments = await this.shipments.findByOrderId(input.orderId);
    return shipments[0] ?? null;
  }
}
