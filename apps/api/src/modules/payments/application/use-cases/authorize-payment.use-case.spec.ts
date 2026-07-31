import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import type { UpdateOrderStatusUseCase } from '../../../orders/application/use-cases/update-order-status.use-case';
import { OrderEntity } from '../../../orders/domain/entities/order.entity';
import { OrderItemEntity } from '../../../orders/domain/entities/order-item.entity';
import type { OrderRepositoryPort } from '../../../orders/domain/ports/order.repository.port';
import {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
} from '../../../orders/domain/value-objects/order-enums';
import { PaymentEntity } from '../../domain/entities/payment.entity';
import { OrderNotFoundError, OrderNotPayableError } from '../../domain/errors/payments.errors';
import type { PaymentRepositoryPort } from '../../domain/ports/payment.repository.port';
import type { PaymentEventRepositoryPort } from '../../domain/ports/payment-event.repository.port';
import type { PaymentProviderPort } from '../../domain/ports/payment-provider.port';
import { PaymentTransactionStatus } from '../../domain/value-objects/payment-status';
import { PaymentProviderRegistry } from '../services/payment-provider-registry.service';
import { AuthorizePaymentUseCase } from './authorize-payment.use-case';

function buildOrder(
  overrides: Partial<{ status: OrderStatus; customerId: string | null }> = {},
): OrderEntity {
  return new OrderEntity({
    id: 'order-1',
    orderNumber: 'ORD-1',
    customerId: overrides.customerId === undefined ? 'customer-1' : overrides.customerId,
    contactEmail: 'a@example.com',
    status: overrides.status ?? OrderStatus.CONFIRMED,
    paymentStatus: PaymentStatus.PENDING,
    fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
    currency: 'MXN',
    subtotal: 100,
    discountTotal: 0,
    shippingTotal: 0,
    taxTotal: 16,
    grandTotal: 116,
    couponCode: null,
    shippingAddressId: null,
    billingAddressId: null,
    shippingMethodId: null,
    cancelledAt: null,
    cancelReason: null,
    items: [
      new OrderItemEntity({
        id: 'item-1',
        orderId: 'order-1',
        productId: 'p1',
        variantId: 'v1',
        sku: 'SKU-1',
        quantity: 1,
        unitPrice: 116,
        subtotal: 116,
      }),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

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
    order?: OrderEntity | null;
    existingPayments?: PaymentEntity[];
    providerResult?: {
      transactionId: string;
      status: 'AUTHORIZED' | 'FAILED';
      raw: Record<string, unknown>;
    };
  } = {},
) {
  const orders: jest.Mocked<OrderRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(options.order === undefined ? buildOrder() : options.order),
    findByCustomerId: jest.fn(),
    findAll: jest.fn(),
    cancel: jest.fn(),
    updateField: jest.fn(),
  };
  const createdPayment = buildPayment();
  const payments: jest.Mocked<PaymentRepositoryPort> = {
    findById: jest.fn(),
    findByOrderId: jest.fn().mockResolvedValue(options.existingPayments ?? []),
    findByProviderTransactionId: jest.fn(),
    create: jest.fn().mockResolvedValue(createdPayment),
    updateStatus: jest.fn(),
    findRefunded: jest.fn(),
  };
  const events: jest.Mocked<PaymentEventRepositoryPort> = {
    findByPaymentId: jest.fn(),
    create: jest.fn().mockResolvedValue(undefined),
  };
  const provider: jest.Mocked<PaymentProviderPort> = {
    name: 'MANUAL',
    authorize: jest
      .fn()
      .mockResolvedValue(
        options.providerResult ?? { transactionId: 'MANUAL-1', status: 'AUTHORIZED', raw: {} },
      ),
    capture: jest.fn(),
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
    useCase: new AuthorizePaymentUseCase(
      orders,
      payments,
      events,
      registry,
      updateOrderStatus,
      auditLog,
    ),
    orders,
    payments,
    events,
    provider,
    updateOrderStatus,
    auditLog,
  };
}

describe('AuthorizePaymentUseCase', () => {
  it('throws OrderNotFoundError when the order does not exist', async () => {
    const { useCase } = buildUseCase({ order: null });

    await expect(useCase.execute({ orderId: 'order-1', provider: 'MANUAL' })).rejects.toThrow(
      OrderNotFoundError,
    );
  });

  it('throws OrderNotPayableError when the order is already cancelled', async () => {
    const { useCase } = buildUseCase({ order: buildOrder({ status: OrderStatus.CANCELLED }) });

    await expect(useCase.execute({ orderId: 'order-1', provider: 'MANUAL' })).rejects.toThrow(
      OrderNotPayableError,
    );
  });

  it('returns the existing payment instead of creating a new one when already authorized', async () => {
    const active = buildPayment({ status: PaymentTransactionStatus.AUTHORIZED });
    const { useCase, payments } = buildUseCase({ existingPayments: [active] });

    const result = await useCase.execute({ orderId: 'order-1', provider: 'MANUAL' });

    expect(result).toBe(active);
    expect(payments.create).not.toHaveBeenCalled();
  });

  it('creates a payment and records an authorize event on success', async () => {
    const { useCase, payments, events } = buildUseCase();

    await useCase.execute({ orderId: 'order-1', provider: 'MANUAL' });

    expect(payments.create).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'order-1', provider: 'MANUAL', amount: 116 }),
    );
    expect(events.create).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'authorize' }));
  });

  it('marks the order paymentStatus as FAILED when the provider declines authorization', async () => {
    const { useCase, updateOrderStatus } = buildUseCase({
      providerResult: { transactionId: 'MANUAL-1', status: 'FAILED', raw: {} },
    });

    await useCase.execute({ orderId: 'order-1', provider: 'MANUAL' });

    expect(updateOrderStatus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'order-1', field: 'paymentStatus', value: 'FAILED' }),
    );
  });

  it('records an audit log entry', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute({ orderId: 'order-1', provider: 'MANUAL' });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'payment.authorized' }),
    );
  });
});
