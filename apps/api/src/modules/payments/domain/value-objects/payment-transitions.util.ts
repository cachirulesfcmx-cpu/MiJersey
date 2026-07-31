import { PaymentTransactionStatus } from './payment-status';

/** "Autorización y captura" (spec §2) — solo un pago `AUTHORIZED` puede capturarse. */
export function canCapturePayment(payment: { status: PaymentTransactionStatus }): boolean {
  return payment.status === PaymentTransactionStatus.AUTHORIZED;
}

/** "Reembolsos totales y parciales" (spec §2) — un pago debe estar capturado (o ya parcialmente reembolsado, para admitir varios reembolsos parciales sucesivos) para poder reembolsarse. */
export function canRefundPayment(payment: { status: PaymentTransactionStatus }): boolean {
  return (
    payment.status === PaymentTransactionStatus.CAPTURED ||
    payment.status === PaymentTransactionStatus.PARTIALLY_REFUNDED
  );
}
