import { PaymentEntity } from '../../domain/entities/payment.entity';
import {
  InvalidWebhookSignatureError,
  PaymentNotFoundError,
} from '../../domain/errors/payments.errors';
import type { PaymentRepositoryPort } from '../../domain/ports/payment.repository.port';
import type { PaymentEventRepositoryPort } from '../../domain/ports/payment-event.repository.port';
import type { PaymentProviderPort } from '../../domain/ports/payment-provider.port';
import { PaymentTransactionStatus } from '../../domain/value-objects/payment-status';
import { PaymentProviderRegistry } from '../services/payment-provider-registry.service';
import { HandlePaymentWebhookUseCase } from './handle-payment-webhook.use-case';

function buildPayment(): PaymentEntity {
  return new PaymentEntity({
    id: 'payment-1',
    orderId: 'order-1',
    provider: 'MANUAL',
    transactionId: 'MANUAL-1',
    amount: 116,
    currency: 'MXN',
    status: PaymentTransactionStatus.CAPTURED,
    authorizedAt: new Date(),
    capturedAt: new Date(),
    refundedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: { signatureValid?: boolean; payment?: PaymentEntity | null } = {}) {
  const payments: jest.Mocked<PaymentRepositoryPort> = {
    findById: jest.fn(),
    findByOrderId: jest.fn(),
    findByProviderTransactionId: jest
      .fn()
      .mockResolvedValue(options.payment === undefined ? buildPayment() : options.payment),
    create: jest.fn(),
    updateStatus: jest.fn(),
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
    refund: jest.fn(),
    verifyWebhookSignature: jest.fn().mockReturnValue(options.signatureValid ?? true),
  };
  const registry = new PaymentProviderRegistry();
  registry.register(provider);

  return {
    useCase: new HandlePaymentWebhookUseCase(registry, payments, events),
    payments,
    events,
    provider,
  };
}

describe('HandlePaymentWebhookUseCase', () => {
  it('throws InvalidWebhookSignatureError when the signature does not match', async () => {
    const { useCase } = buildUseCase({ signatureValid: false });

    await expect(
      useCase.execute({
        provider: 'MANUAL',
        rawBody: JSON.stringify({ transactionId: 'MANUAL-1', eventType: 'captured' }),
        signature: 'bad-signature',
      }),
    ).rejects.toThrow(InvalidWebhookSignatureError);
  });

  it('throws PaymentNotFoundError when the transaction is unknown', async () => {
    const { useCase } = buildUseCase({ payment: null });

    await expect(
      useCase.execute({
        provider: 'MANUAL',
        rawBody: JSON.stringify({ transactionId: 'MANUAL-unknown', eventType: 'captured' }),
        signature: 'sig',
      }),
    ).rejects.toThrow(PaymentNotFoundError);
  });

  it('records the webhook event when the signature and transaction are valid', async () => {
    const { useCase, events } = buildUseCase();

    await useCase.execute({
      provider: 'MANUAL',
      rawBody: JSON.stringify({ transactionId: 'MANUAL-1', eventType: 'captured' }),
      signature: 'sig',
    });

    expect(events.create).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: 'payment-1', eventType: 'webhook.captured' }),
    );
  });
});
