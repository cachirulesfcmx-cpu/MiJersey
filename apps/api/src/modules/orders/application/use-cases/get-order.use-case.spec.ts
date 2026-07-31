import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderNotFoundError } from '../../domain/errors/orders.errors';
import type { OrderRepositoryPort } from '../../domain/ports/order.repository.port';
import {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
} from '../../domain/value-objects/order-enums';
import { GetOrderUseCase } from './get-order.use-case';

function buildOrder(
  overrides: Partial<{ id: string; customerId: string | null }> = {},
): OrderEntity {
  return new OrderEntity({
    id: overrides.id ?? 'order-1',
    orderNumber: 'ORD-1',
    customerId: overrides.customerId === undefined ? 'customer-1' : overrides.customerId,
    contactEmail: 'a@example.com',
    status: OrderStatus.CONFIRMED,
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
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: { order?: OrderEntity | null } = {}) {
  const orders: jest.Mocked<OrderRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(options.order === undefined ? buildOrder() : options.order),
    findByCustomerId: jest.fn(),
    findAll: jest.fn(),
    cancel: jest.fn(),
    updateField: jest.fn(),
  };

  return { useCase: new GetOrderUseCase(orders), orders };
}

describe('GetOrderUseCase', () => {
  it('returns the order when it belongs to the requesting customer', async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute({ id: 'order-1', customerId: 'customer-1' });

    expect(result.id).toBe('order-1');
  });

  it('throws OrderNotFoundError when the order does not exist', async () => {
    const { useCase } = buildUseCase({ order: null });

    await expect(useCase.execute({ id: 'missing', customerId: 'customer-1' })).rejects.toThrow(
      OrderNotFoundError,
    );
  });

  it('throws OrderNotFoundError (not a 403) when the order belongs to another customer', async () => {
    const { useCase } = buildUseCase({ order: buildOrder({ customerId: 'someone-else' }) });

    await expect(useCase.execute({ id: 'order-1', customerId: 'customer-1' })).rejects.toThrow(
      OrderNotFoundError,
    );
  });
});
