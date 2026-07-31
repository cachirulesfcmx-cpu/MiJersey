import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import type { UpdateOrderStatusUseCase } from '../../../orders/application/use-cases/update-order-status.use-case';
import { PaymentEntity } from '../../domain/entities/payment.entity';
import {
  PaymentNotCapturableError,
  PaymentNotFoundError,
} from '../../domain/errors/payments.errors';
import type { PaymentRepositoryPort } from '../../domain/ports/payment.repository.port';
import type { PaymentEventRepositoryPort } from '../../domain/ports/payment-event.repository.port';
import type { PaymentProviderPort } from '../../domain/ports/payment-provider.port';
import { PaymentTransactionStatus } from '../../domain/value-objects/payment-status';
import { PaymentProviderRegistry } from '../services/payment-provider-registry.service';
import { CapturePaymentUseCase } from './capture-payment.use-case';

function buildPayment(
  overrides: Partial<{ status: PaymentTransactionStatus }> = {},
): PaymentEntity {
  return new PaymentEntity({
    id: 'payment-1',
    orderId: 'order-1',
    provider: 'MANUAL',
    transactionId: 'MANUAL-1',
    amount: 116,
    currency: 'MXN',
    status: overrides.status ?? PaymentTransactionStatus.AUTHORIZED,
    authorizedAt: new Date(),
    capturedAt: null,
    refundedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(
  options: {
    payment?: PaymentEntity | null;
    captureResult?: { status: 'CAPTURED' | 'FAILED'; raw: Record<string, unknown> };
  } = {},
) {
  const capturedPayment = buildPayment({ status: PaymentTransactionStatus.CAPTURED });
  const payments: jest.Mocked<PaymentRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(options.payment === undefined ? buildPayment() : options.payment),
    findByOrderId: jest.fn(),
    findByProviderTransactionId: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn().mockResolvedValue(capturedPayment),
    findRefunded: jest.fn(),
  };
  const events: jest.Mocked<PaymentEventRepositoryPort> = {
    findByPaymentId: jest.fn(),
    create: jest.fn().mockResolvedValue(undefined),
  };
  const provider: jest.Mocked<PaymentProviderPort> = {
    name: 'MANUAL',
    authorize: jest.fn(),
    capture: jest.fn().mockResolvedValue(options.captureResult ?? { status: 'CAPTURED', raw: {} }),
    refund: jest.fn(),
    verifyWebhookSignature: jest.fn(),
  };
  const registry = new PaymentProviderRegistry();
  registry.register(provider);
  const updateOrderStatus = {
    execute: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<UpdateOrderStatusUseCase>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new CapturePaymentUseCase(payments, events, registry, updateOrderStatus, auditLog),
    payments,
    events,
    updateOrderStatus,
    auditLog,
  };
}

describe('CapturePaymentUseCase', () => {
  it('throws PaymentNotFoundError when the payment does not exist', async () => {
    const { useCase } = buildUseCase({ payment: null });

    await expect(useCase.execute({ paymentId: 'payment-1' })).rejects.toThrow(PaymentNotFoundError);
  });

  it('throws PaymentNotCapturableError when the payment is not authorized', async () => {
    const { useCase } = buildUseCase({
      payment: buildPayment({ status: PaymentTransactionStatus.CAPTURED }),
    });

    await expect(useCase.execute({ paymentId: 'payment-1' })).rejects.toThrow(
      PaymentNotCapturableError,
    );
  });

  it('captures the payment and marks the order as PAID', async () => {
    const { useCase, payments, updateOrderStatus } = buildUseCase();

    await useCase.execute({ paymentId: 'payment-1' });

    expect(payments.updateStatus).toHaveBeenCalledWith(
      'payment-1',
      expect.objectContaining({ status: PaymentTransactionStatus.CAPTURED }),
    );
    expect(updateOrderStatus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'order-1', field: 'paymentStatus', value: 'PAID' }),
    );
  });

  it('marks the order as FAILED when the provider declines the capture', async () => {
    const { useCase, updateOrderStatus } = buildUseCase({
      captureResult: { status: 'FAILED', raw: {} },
    });

    await useCase.execute({ paymentId: 'payment-1' });

    expect(updateOrderStatus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ field: 'paymentStatus', value: 'FAILED' }),
    );
  });
});
