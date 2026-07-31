import { FulfillmentStatus, OrderStatus } from './order-enums';
import { canCancelOrder } from './order-transitions.util';

describe('canCancelOrder', () => {
  it('allows cancelling a confirmed, unfulfilled order', () => {
    expect(
      canCancelOrder({
        status: OrderStatus.CONFIRMED,
        fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
      }),
    ).toBe(true);
  });

  it('allows cancelling while still processing (not shipped yet)', () => {
    expect(
      canCancelOrder({
        status: OrderStatus.CONFIRMED,
        fulfillmentStatus: FulfillmentStatus.PROCESSING,
      }),
    ).toBe(true);
  });

  it.each([OrderStatus.CANCELLED, OrderStatus.REFUNDED])(
    'rejects an order already in a terminal status (%s)',
    (status) => {
      expect(canCancelOrder({ status, fulfillmentStatus: FulfillmentStatus.UNFULFILLED })).toBe(
        false,
      );
    },
  );

  it.each([FulfillmentStatus.SHIPPED, FulfillmentStatus.DELIVERED])(
    'rejects an order once it has shipped (%s)',
    (fulfillmentStatus) => {
      expect(canCancelOrder({ status: OrderStatus.CONFIRMED, fulfillmentStatus })).toBe(false);
    },
  );
});
