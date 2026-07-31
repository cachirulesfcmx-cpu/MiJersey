import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { UpdateOrderStatusUseCase } from '../../../orders/application/use-cases/update-order-status.use-case';
import type { PaymentEntity } from '../../domain/entities/payment.entity';
import {
  PaymentNotCapturableError,
  PaymentNotFoundError,
} from '../../domain/errors/payments.errors';
import type { PaymentRepositoryPort } from '../../domain/ports/payment.repository.port';
import type { PaymentEventRepositoryPort } from '../../domain/ports/payment-event.repository.port';
import { PaymentTransactionStatus } from '../../domain/value-objects/payment-status';
import { canCapturePayment } from '../../domain/value-objects/payment-transitions.util';
import { PAYMENT_EVENT_REPOSITORY, PAYMENT_REPOSITORY } from '../../payments.constants';
import { PaymentProviderRegistry } from '../services/payment-provider-registry.service';

export interface CapturePaymentInput {
  paymentId: string;
}

@Injectable()
export class CapturePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepositoryPort,
    @Inject(PAYMENT_EVENT_REPOSITORY) private readonly events: PaymentEventRepositoryPort,
    private readonly providerRegistry: PaymentProviderRegistry,
    private readonly updateOrderStatus: UpdateOrderStatusUseCase,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CapturePaymentInput): Promise<PaymentEntity> {
    const payment = await this.payments.findById(input.paymentId);
    if (!payment) throw new PaymentNotFoundError();
    if (!canCapturePayment(payment)) throw new PaymentNotCapturableError();

    const provider = this.providerRegistry.get(payment.provider);
    const result = await provider.capture(payment.transactionId);
    const captured = result.status === 'CAPTURED';

    const updated = await this.payments.updateStatus(payment.id, {
      status: captured ? PaymentTransactionStatus.CAPTURED : PaymentTransactionStatus.FAILED,
      capturedAt: captured ? new Date() : null,
    });

    await this.events.create({ paymentId: payment.id, eventType: 'capture', payload: result.raw });

    await this.updateOrderStatus.execute({
      orderId: payment.orderId,
      field: 'paymentStatus',
      value: captured ? 'PAID' : 'FAILED',
      note: captured ? 'Pago capturado' : 'Captura de pago fallida',
    });

    await this.auditLog.record({
      userId: null,
      action: 'payment.captured',
      ipAddress: null,
      metadata: { paymentId: payment.id, status: updated.status },
    });

    return updated;
  }
}
