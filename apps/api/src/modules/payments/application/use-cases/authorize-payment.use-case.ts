import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { UpdateOrderStatusUseCase } from '../../../orders/application/use-cases/update-order-status.use-case';
import type { OrderRepositoryPort } from '../../../orders/domain/ports/order.repository.port';
import { OrderStatus } from '../../../orders/domain/value-objects/order-enums';
import { ORDER_REPOSITORY } from '../../../orders/orders.constants';
import type { PaymentEntity } from '../../domain/entities/payment.entity';
import { OrderNotFoundError, OrderNotPayableError } from '../../domain/errors/payments.errors';
import type { PaymentRepositoryPort } from '../../domain/ports/payment.repository.port';
import type { PaymentEventRepositoryPort } from '../../domain/ports/payment-event.repository.port';
import { PaymentTransactionStatus } from '../../domain/value-objects/payment-status';
import { PAYMENT_EVENT_REPOSITORY, PAYMENT_REPOSITORY } from '../../payments.constants';
import { PaymentProviderRegistry } from '../services/payment-provider-registry.service';

export interface AuthorizePaymentInput {
  orderId: string;
  provider: string;
}

/**
 * Endpoint público a propósito (spec §2 Checkout admite invitados, 018) — no hay una noción de
 * "propietario" que validar aquí: el `orderId` recién devuelto por `POST /checkout/confirm` es en
 * sí mismo la capacidad para iniciar su pago, igual que un client secret de un proveedor real.
 * `GET /payments/:id` sí exige sesión y verifica propiedad, ver `GetPaymentUseCase`.
 */
@Injectable()
export class AuthorizePaymentUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepositoryPort,
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepositoryPort,
    @Inject(PAYMENT_EVENT_REPOSITORY) private readonly events: PaymentEventRepositoryPort,
    private readonly providerRegistry: PaymentProviderRegistry,
    private readonly updateOrderStatus: UpdateOrderStatusUseCase,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: AuthorizePaymentInput): Promise<PaymentEntity> {
    const order = await this.orders.findById(input.orderId);
    if (!order) throw new OrderNotFoundError();
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      throw new OrderNotPayableError();
    }

    // Idempotencia: si ya existe una autorización o captura vigente, no duplicar el pago.
    const existing = await this.payments.findByOrderId(order.id);
    const active = existing.find(
      (payment) =>
        payment.status === PaymentTransactionStatus.AUTHORIZED ||
        payment.status === PaymentTransactionStatus.CAPTURED,
    );
    if (active) return active;

    const orderJson = order.toJSON();
    const provider = this.providerRegistry.get(input.provider);
    const result = await provider.authorize({
      orderId: order.id,
      amount: orderJson.grandTotal,
      currency: orderJson.currency,
    });

    const payment = await this.payments.create({
      orderId: order.id,
      provider: provider.name,
      transactionId: result.transactionId,
      amount: orderJson.grandTotal,
      currency: orderJson.currency,
      status:
        result.status === 'AUTHORIZED'
          ? PaymentTransactionStatus.AUTHORIZED
          : PaymentTransactionStatus.FAILED,
    });

    await this.events.create({
      paymentId: payment.id,
      eventType: 'authorize',
      payload: result.raw,
    });

    if (result.status === 'FAILED') {
      await this.updateOrderStatus.execute({
        orderId: order.id,
        field: 'paymentStatus',
        value: 'FAILED',
        note: 'Autorización de pago fallida',
      });
    }

    await this.auditLog.record({
      userId: order.customerId,
      action: 'payment.authorized',
      ipAddress: null,
      metadata: { paymentId: payment.id, orderId: order.id, status: payment.status },
    });

    return payment;
  }
}
