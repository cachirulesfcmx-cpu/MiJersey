import type { Payment } from '@mijersey/sdk';

const LABELS: Record<Payment['status'], string> = {
  PENDING: 'Pendiente',
  AUTHORIZED: 'Autorizado, procesando…',
  CAPTURED: 'Pago confirmado',
  FAILED: 'Pago fallido',
  CANCELLED: 'Pago cancelado',
  REFUNDED: 'Reembolsado',
  PARTIALLY_REFUNDED: 'Reembolsado parcialmente',
};

/** Payment Status (spec 022 §6). */
export function PaymentStatus({ payment }: { payment: Payment }) {
  const isPaid = payment.status === 'CAPTURED';

  return (
    <div
      className={`flex items-center gap-2 rounded-md border p-4 text-sm ${
        isPaid
          ? 'border-success-200 bg-success-50 text-success-700'
          : 'border-neutral-200 bg-neutral-50 text-neutral-700'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isPaid ? 'bg-success-600' : 'bg-neutral-400'}`} />
      <span>{LABELS[payment.status]}</span>
    </div>
  );
}
