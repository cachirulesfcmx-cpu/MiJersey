import type { AddCartItemUseCase } from '../../../cart/application/use-cases/add-cart-item.use-case';
import type { GetOrCreateCartUseCase } from '../../../cart/application/use-cases/get-or-create-cart.use-case';
import type { CartEntity } from '../../../cart/domain/entities/cart.entity';
import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { OrderEntity } from '../../domain/entities/order.entity';
import { OrderItemEntity } from '../../domain/entities/order-item.entity';
import {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
} from '../../domain/value-objects/order-enums';
import type { GetOrderUseCase } from './get-order.use-case';
import { ReorderUseCase } from './reorder.use-case';

function buildOrderItem(
  overrides: Partial<{ variantId: string; quantity: number }> = {},
): OrderItemEntity {
  return new OrderItemEntity({
    id: `item-${overrides.variantId ?? '1'}`,
    orderId: 'order-1',
    productId: 'product-1',
    variantId: overrides.variantId ?? 'variant-1',
    sku: 'SKU-1',
    quantity: overrides.quantity ?? 1,
    unitPrice: 100,
    subtotal: 100 * (overrides.quantity ?? 1),
  });
}

function buildOrder(items: OrderItemEntity[]): OrderEntity {
  return new OrderEntity({
    id: 'order-1',
    orderNumber: 'ORD-1',
    customerId: 'customer-1',
    contactEmail: 'a@example.com',
    status: OrderStatus.CONFIRMED,
    paymentStatus: PaymentStatus.PAID,
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
    items,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: { items?: OrderItemEntity[]; addItemFails?: string[] } = {}) {
  const items = options.items ?? [buildOrderItem()];
  const order = buildOrder(items);
  const failing = new Set(options.addItemFails ?? []);

  const getOrder = {
    execute: jest.fn().mockResolvedValue(order),
  } as unknown as jest.Mocked<GetOrderUseCase>;
  const getOrCreateCart = {
    execute: jest.fn().mockResolvedValue({ id: 'cart-1' } as CartEntity),
  } as unknown as jest.Mocked<GetOrCreateCartUseCase>;
  const addCartItem = {
    execute: jest.fn().mockImplementation(async (input: { variantId: string }) => {
      if (failing.has(input.variantId)) throw new Error('not available');
      return { id: 'cart-1' } as CartEntity;
    }),
  } as unknown as jest.Mocked<AddCartItemUseCase>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new ReorderUseCase(getOrder, getOrCreateCart, addCartItem, auditLog),
    getOrder,
    getOrCreateCart,
    addCartItem,
    auditLog,
  };
}

describe('ReorderUseCase', () => {
  it('adds every order line to the cart via the reused Cart use cases', async () => {
    const { useCase, getOrCreateCart, addCartItem } = buildUseCase({
      items: [buildOrderItem({ variantId: 'variant-1', quantity: 2 })],
    });

    const result = await useCase.execute({
      id: 'order-1',
      customerId: 'customer-1',
      sessionId: 'session-1',
    });

    expect(getOrCreateCart.execute).toHaveBeenCalledWith({
      sessionId: 'session-1',
      customerId: 'customer-1',
    });
    expect(addCartItem.execute).toHaveBeenCalledWith({
      cartId: 'cart-1',
      variantId: 'variant-1',
      quantity: 2,
    });
    expect(result.succeededCount).toBe(1);
    expect(result.failedCount).toBe(0);
  });

  it('continues past lines that can no longer be added and reports the failure count', async () => {
    const { useCase } = buildUseCase({
      items: [
        buildOrderItem({ variantId: 'variant-ok' }),
        buildOrderItem({ variantId: 'variant-gone' }),
      ],
      addItemFails: ['variant-gone'],
    });

    const result = await useCase.execute({
      id: 'order-1',
      customerId: 'customer-1',
      sessionId: 'session-1',
    });

    expect(result.succeededCount).toBe(1);
    expect(result.failedCount).toBe(1);
  });

  it('records an audit log entry with the outcome', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute({ id: 'order-1', customerId: 'customer-1', sessionId: 'session-1' });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'order.reordered' }),
    );
  });
});
