import { OrderNotFoundError } from '../../domain/errors/customer.errors';
import type {
  CustomerOrderDetailView,
  CustomerOrderLookupPort,
} from '../../domain/ports/customer-order-lookup.port';
import { GetMyOrderUseCase } from './get-my-order.use-case';

function buildOrder(customerId: string | null): CustomerOrderDetailView {
  return {
    id: 'order-1',
    orderNumber: 'ORD-20260730-AAAA1111',
    customerId,
    status: 'CONFIRMED',
    paymentStatus: 'PENDING',
    fulfillmentStatus: 'UNFULFILLED',
    currency: 'MXN',
    subtotal: 700,
    discountTotal: 0,
    shippingTotal: 120,
    taxTotal: 131.2,
    grandTotal: 951.2,
    itemCount: 1,
    items: [],
    createdAt: new Date(),
  };
}

function buildUseCase(order: CustomerOrderDetailView | null) {
  const orders: jest.Mocked<CustomerOrderLookupPort> = {
    findByCustomerId: jest.fn(),
    findById: jest.fn().mockResolvedValue(order),
  };

  return { useCase: new GetMyOrderUseCase(orders), orders };
}

describe('GetMyOrderUseCase', () => {
  it('throws when the order does not exist', async () => {
    const { useCase } = buildUseCase(null);

    await expect(
      useCase.execute({ id: 'order-1', customerId: 'customer-1' }),
    ).rejects.toBeInstanceOf(OrderNotFoundError);
  });

  it('throws when the order belongs to a different customer (reported as not-found)', async () => {
    const { useCase } = buildUseCase(buildOrder('someone-else'));

    await expect(
      useCase.execute({ id: 'order-1', customerId: 'customer-1' }),
    ).rejects.toBeInstanceOf(OrderNotFoundError);
  });

  it('returns the order when it belongs to the requesting customer', async () => {
    const order = buildOrder('customer-1');
    const { useCase } = buildUseCase(order);

    const result = await useCase.execute({ id: 'order-1', customerId: 'customer-1' });

    expect(result).toBe(order);
  });
});
