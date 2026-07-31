import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import type { UpdateOrderStatusUseCase } from '../../../orders/application/use-cases/update-order-status.use-case';
import { PaymentEntity } from '../../domain/entities/payment.entity';
import {
  InvalidRefundAmountError,
  PaymentNotFoundError,
  PaymentNotRefundableError,
  RefundProcessingError,
} from '../../domain/errors/payments.errors';
import type { PaymentRepositoryPort } from '../../domain/ports/payment.repository.port';
import type { PaymentEventRepositoryPort } from '../../domain/ports/payment-event.repository.port';
import type { PaymentProviderPort } from '../../domain/ports/payment-provider.port';
import { PaymentTransactionStatus } from '../../domain/value-objects/payment-status';
import { PaymentProviderRegistry } from '../services/payment-provider-registry.service';
import { RefundPaymentUseCase } from './refund-payment.use-case';

function buildPayment(
  overrides: Partial<{ status: PaymentTransactionStatus; amount: number }> = {},
): PaymentEntity {
  return new PaymentEntity({
    id: 'payment-1',
    orderId: 'order-1',
    provider: 'MANUAL',
    transactionId: 'MANUAL-1',
    amount: overrides.amount ?? 116,
    currency: 'MXN',
    status: overrides.status ?? PaymentTransactionStatus.CAPTURED,
    authorizedAt: new Date(),
    capturedAt: new Date(),
    refundedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(
  options: {
    payment?: PaymentEntity | null;
    refundResult?: {
      status: 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'FAILED';
      raw: Record<string, unknown>;
    };
  } = {},
) {
  const payments: jest.Mocked<PaymentRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(options.payment === undefined ? buildPayment() : options.payment),
    findByOrderId: jest.fn(),
    findByProviderTransactionId: jest.fn(),
    create: jest.fn(),
    updateStatus: jest
      .fn()
      .mockImplementation(async (id, patch) => buildPayment({ status: patch.status })),
    findRefunded: jest.fn(),
  };
  const events: jest.Mocked<PaymentEventRepositoryPort> = {
    findByPaymentId: jest.fn(),
    create: jest.fn().mockResolvedValue(undefined),
  };
  const provider: jest.Mocked<PaymentProviderPort> = {
    name: 'MANUAL',
    authorize: jest.fn(),
    capture: jest.fn(),
    refund: jest.fn().mockResolvedValue(options.refundResult ?? { status: 'REFUNDED', raw: {} }),
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
    useCase: new RefundPaymentUseCase(payments, events, registry, updateOrderStatus, auditLog),
    payments,
    events,
    updateOrderStatus,
    auditLog,
  };
}

describe('RefundPaymentUseCase', () => {
  it('throws PaymentNotFoundError when the payment does not exist', async () => {
    const { useCase } = buildUseCase({ payment: null });

    await expect(
      useCase.execute({ paymentId: 'payment-1', actorUserId: 'admin-1' }),
    ).rejects.toThrow(PaymentNotFoundError);
  });

  it('throws PaymentNotRefundableError when the payment was never captured', async () => {
    const { useCase } = buildUseCase({
      payment: buildPayment({ status: PaymentTransactionStatus.AUTHORIZED }),
    });

    await expect(
      useCase.execute({ paymentId: 'payment-1', actorUserId: 'admin-1' }),
    ).rejects.toThrow(PaymentNotRefundableError);
  });

  it('throws InvalidRefundAmountError when the requested amount exceeds the payment', async () => {
    const { useCase } = buildUseCase({ payment: buildPayment({ amount: 100 }) });

    await expect(
      useCase.execute({ paymentId: 'payment-1', actorUserId: 'admin-1', amount: 150 }),
    ).rejects.toThrow(InvalidRefundAmountError);
  });

  it('throws RefundProcessingError when the provider declines the refund', async () => {
    const { useCase } = buildUseCase({ refundResult: { status: 'FAILED', raw: {} } });

    await expect(
      useCase.execute({ paymentId: 'payment-1', actorUserId: 'admin-1' }),
    ).rejects.toThrow(RefundProcessingError);
  });

  it('marks the order as REFUNDED on a full refund', async () => {
    const { useCase, updateOrderStatus } = buildUseCase();

    await useCase.execute({ paymentId: 'payment-1', actorUserId: 'admin-1' });

    expect(updateOrderStatus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'order-1', field: 'paymentStatus', value: 'REFUNDED' }),
    );
  });

  it('does not touch the order status on a partial refund', async () => {
    const { useCase, updateOrderStatus, payments } = buildUseCase({
      payment: buildPayment({ amount: 100 }),
      refundResult: { status: 'PARTIALLY_REFUNDED', raw: {} },
    });

    await useCase.execute({ paymentId: 'payment-1', actorUserId: 'admin-1', amount: 40 });

    expect(payments.updateStatus).toHaveBeenCalledWith(
      'payment-1',
      expect.objectContaining({ status: PaymentTransactionStatus.PARTIALLY_REFUNDED }),
    );
    expect(updateOrderStatus.execute).not.toHaveBeenCalled();
  });

  it('records an audit log entry', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute({ paymentId: 'payment-1', actorUserId: 'admin-1' });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'payment.refunded' }),
    );
  });
});
