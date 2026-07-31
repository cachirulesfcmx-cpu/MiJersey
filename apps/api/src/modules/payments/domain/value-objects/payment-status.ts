/** Copia propia del enum — mismo criterio que Order en Checkout/Orders: cada módulo define sus propios tipos sobre las tablas que usa en vez de importarlos entre sí. */
export enum PaymentTransactionStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}
