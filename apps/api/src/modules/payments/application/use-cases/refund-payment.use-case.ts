import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { UpdateOrderStatusUseCase } from '../../../orders/application/use-cases/update-order-status.use-case';
import type { PaymentEntity } from '../../domain/entities/payment.entity';
import {
  InvalidRefundAmountError,
  PaymentNotFoundError,
  PaymentNotRefundableError,
  RefundProcessingError,
} from '../../domain/errors/payments.errors';
import type { PaymentRepositoryPort } from '../../domain/ports/payment.repository.port';
import type { PaymentEventRepositoryPort } from '../../domain/ports/payment-event.repository.port';
import { PaymentTransactionStatus } from '../../domain/value-objects/payment-status';
import { canRefundPayment } from '../../domain/value-objects/payment-transitions.util';
import { PAYMENT_EVENT_REPOSITORY, PAYMENT_REPOSITORY } from '../../payments.constants';
import { PaymentProviderRegistry } from '../services/payment-provider-registry.service';

export interface RefundPaymentInput {
  paymentId: string;
  actorUserId: string;
  amount?: number;
  reason?: string;
}

/** Reembolsos parciales no cambian `Order.paymentStatus` (sigue `PAID`) — ese enum (018/021) no tiene un estado "parcialmente reembolsado"; el detalle vive en `Payment.status`. Solo un reembolso total mueve el pedido a `paymentStatus: REFUNDED`. */
@Injectable()
export class RefundPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepositoryPort,
    @Inject(PAYMENT_EVENT_REPOSITORY) private readonly events: PaymentEventRepositoryPort,
    private readonly providerRegistry: PaymentProviderRegistry,
    private readonly updateOrderStatus: UpdateOrderStatusUseCase,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: RefundPaymentInput): Promise<PaymentEntity> {
    const payment = await this.payments.findById(input.paymentId);
    if (!payment) throw new PaymentNotFoundError();
    if (!canRefundPayment(payment)) throw new PaymentNotRefundableError();
    if (input.amount !== undefined && input.amount > payment.amount) {
      throw new InvalidRefundAmountError();
    }

    const provider = this.providerRegistry.get(payment.provider);
    const result = await provider.refund(payment.transactionId, input.amount);

    if (result.status === 'FAILED') {
      await this.events.create({
        paymentId: payment.id,
        eventType: 'refund_failed',
        payload: result.raw,
      });
      throw new RefundProcessingError();
    }

    const isFullRefund = input.amount === undefined || input.amount >= payment.amount;
    const newStatus = isFullRefund
      ? PaymentTransactionStatus.REFUNDED
      : PaymentTransactionStatus.PARTIALLY_REFUNDED;

    const updated = await this.payments.updateStatus(payment.id, {
      status: newStatus,
      refundedAt: new Date(),
    });

    await this.events.create({
      paymentId: payment.id,
      eventType: 'refund',
      payload: {
        ...result.raw,
        amount: input.amount ?? payment.amount,
        reason: input.reason ?? null,
      },
    });

    if (isFullRefund) {
      await this.updateOrderStatus.execute({
        orderId: payment.orderId,
        field: 'paymentStatus',
        value: 'REFUNDED',
        note: input.reason ?? 'Reembolso total',
      });
    }

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'payment.refunded',
      ipAddress: null,
      metadata: {
        paymentId: payment.id,
        amount: input.amount ?? payment.amount,
        full: isFullRefund,
      },
    });

    return updated;
  }
}
