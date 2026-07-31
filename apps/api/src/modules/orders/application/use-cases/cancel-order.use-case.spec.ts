import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderNotCancellableError, OrderNotFoundError } from '../../domain/errors/orders.errors';
import type { OrderRepositoryPort } from '../../domain/ports/order.repository.port';
import type { OrderStatusHistoryRepositoryPort } from '../../domain/ports/order-status-history.repository.port';
import {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
} from '../../domain/value-objects/order-enums';
import { CancelOrderUseCase } from './cancel-order.use-case';

function buildOrder(
  overrides: Partial<{
    customerId: string | null;
    status: OrderStatus;
    fulfillmentStatus: FulfillmentStatus;
  }> = {},
): OrderEntity {
  return new OrderEntity({
    id: 'order-1',
    orderNumber: 'ORD-1',
    customerId: overrides.customerId === undefined ? 'customer-1' : overrides.customerId,
    contactEmail: 'a@example.com',
    status: overrides.status ?? OrderStatus.CONFIRMED,
    paymentStatus: PaymentStatus.PENDING,
    fulfillmentStatus: overrides.fulfillmentStatus ?? FulfillmentStatus.UNFULFILLED,
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
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: { order?: OrderEntity | null } = {}) {
  const cancelledOrder = buildOrder({ status: OrderStatus.CANCELLED });
  const orders: jest.Mocked<OrderRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(options.order === undefined ? buildOrder() : options.order),
    findByCustomerId: jest.fn(),
    findAll: jest.fn(),
    cancel: jest.fn().mockResolvedValue(cancelledOrder),
    updateField: jest.fn(),
  };
  const history: jest.Mocked<OrderStatusHistoryRepositoryPort> = {
    findByOrderId: jest.fn(),
    create: jest.fn().mockResolvedValue(undefined),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new CancelOrderUseCase(orders, history, auditLog), orders, history, auditLog };
}

describe('CancelOrderUseCase', () => {
  it('throws OrderNotFoundError when the order does not belong to the customer', async () => {
    const { useCase } = buildUseCase({ order: buildOrder({ customerId: 'someone-else' }) });

    await expect(useCase.execute({ id: 'order-1', customerId: 'customer-1' })).rejects.toThrow(
      OrderNotFoundError,
    );
  });

  it('throws OrderNotCancellableError when the order already shipped', async () => {
    const { useCase, orders } = buildUseCase({
      order: buildOrder({ fulfillmentStatus: FulfillmentStatus.SHIPPED }),
    });

    await expect(useCase.execute({ id: 'order-1', customerId: 'customer-1' })).rejects.toThrow(
      OrderNotCancellableError,
    );
    expect(orders.cancel).not.toHaveBeenCalled();
  });

  it('throws OrderNotCancellableError when the order is already cancelled', async () => {
    const { useCase } = buildUseCase({ order: buildOrder({ status: OrderStatus.CANCELLED }) });

    await expect(useCase.execute({ id: 'order-1', customerId: 'customer-1' })).rejects.toThrow(
      OrderNotCancellableError,
    );
  });

  it('cancels the order and records the reason in the status history', async () => {
    const { useCase, orders, history } = buildUseCase();

    await useCase.execute({ id: 'order-1', customerId: 'customer-1', reason: 'Ya no lo quiero' });

    expect(orders.cancel).toHaveBeenCalledWith('order-1', 'Ya no lo quiero');
    expect(history.create).toHaveBeenCalledWith({
      orderId: 'order-1',
      field: 'status',
      value: 'CANCELLED',
      note: 'Ya no lo quiero',
    });
  });

  it('records an audit log entry', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute({ id: 'order-1', customerId: 'customer-1' });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'order.cancelled' }),
    );
  });
});
