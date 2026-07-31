import { Inject, Injectable } from '@nestjs/common';

import { GetOrderUseCase } from '../../../orders/application/use-cases/get-order.use-case';
import type { PaymentEntity } from '../../domain/entities/payment.entity';
import { PaymentNotFoundError } from '../../domain/errors/payments.errors';
import type { PaymentRepositoryPort } from '../../domain/ports/payment.repository.port';
import { PAYMENT_REPOSITORY } from '../../payments.constants';

export interface GetPaymentInput {
  id: string;
  customerId: string;
}

/**
 * Reutiliza `GetOrderUseCase` (Orders, exportado) para la comprobación de propiedad en vez de
 * construir un lookup propio: si el pedido del pago no existe o no es del cliente autenticado,
 * `GetOrderUseCase` ya lanza su propio `OrderNotFoundError` — se traduce aquí al `PaymentNotFoundError`
 * de este módulo para que el filtro de excepciones de Payments (que solo atrapa `PaymentError`) lo
 * capture correctamente, sin que el error de Orders se escape sin manejar.
 */
@Injectable()
export class GetPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepositoryPort,
    private readonly getOrder: GetOrderUseCase,
  ) {}

  async execute(input: GetPaymentInput): Promise<PaymentEntity> {
    const payment = await this.payments.findById(input.id);
    if (!payment) throw new PaymentNotFoundError();

    try {
      await this.getOrder.execute({ id: payment.orderId, customerId: input.customerId });
    } catch {
      throw new PaymentNotFoundError();
    }

    return payment;
  }
}
