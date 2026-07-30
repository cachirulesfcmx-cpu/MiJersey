import type { Cart } from '@mijersey/sdk';

function formatPrice(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function OrderSummary({ cart }: { cart: Cart }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-4">
      <div className="flex justify-between text-sm">
        <span className="text-neutral-500">Subtotal</span>
        <span className="text-neutral-900">{formatPrice(cart.subtotal)}</span>
      </div>
      {cart.discount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-neutral-500">
            Descuento{cart.coupon ? ` (${cart.coupon.code})` : ''}
          </span>
          <span className="text-danger-600">-{formatPrice(cart.discount)}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold">
        <span>Total</span>
        <span>{formatPrice(cart.total)}</span>
      </div>
      <p className="text-xs text-neutral-400">Envío calculado en el checkout.</p>
    </div>
  );
}
