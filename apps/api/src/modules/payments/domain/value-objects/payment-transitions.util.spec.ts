import { PaymentTransactionStatus } from './payment-status';
import { canCapturePayment, canRefundPayment } from './payment-transitions.util';

describe('canCapturePayment', () => {
  it('allows capturing an authorized payment', () => {
    expect(canCapturePayment({ status: PaymentTransactionStatus.AUTHORIZED })).toBe(true);
  });

  it.each([
    PaymentTransactionStatus.PENDING,
    PaymentTransactionStatus.CAPTURED,
    PaymentTransactionStatus.FAILED,
    PaymentTransactionStatus.CANCELLED,
    PaymentTransactionStatus.REFUNDED,
    PaymentTransactionStatus.PARTIALLY_REFUNDED,
  ])('rejects capturing a payment in status %s', (status) => {
    expect(canCapturePayment({ status })).toBe(false);
  });
});

describe('canRefundPayment', () => {
  it('allows refunding a captured payment', () => {
    expect(canRefundPayment({ status: PaymentTransactionStatus.CAPTURED })).toBe(true);
  });

  it('allows a second partial refund on an already partially refunded payment', () => {
    expect(canRefundPayment({ status: PaymentTransactionStatus.PARTIALLY_REFUNDED })).toBe(true);
  });

  it.each([
    PaymentTransactionStatus.PENDING,
    PaymentTransactionStatus.AUTHORIZED,
    PaymentTransactionStatus.FAILED,
    PaymentTransactionStatus.CANCELLED,
    PaymentTransactionStatus.REFUNDED,
  ])('rejects refunding a payment in status %s', (status) => {
    expect(canRefundPayment({ status })).toBe(false);
  });
});
