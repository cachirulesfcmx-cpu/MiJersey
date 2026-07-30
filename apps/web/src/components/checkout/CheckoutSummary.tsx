'use client';

import type { Checkout } from '@mijersey/sdk';
import { Button } from '@mijersey/ui';

function formatPrice(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function formatAddress(address: Checkout['shippingAddress']): string {
  if (!address) return '—';
  return `${address.firstName} ${address.lastName}, ${address.addressLine1}${
    address.addressLine2 ? `, ${address.addressLine2}` : ''
  }, ${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;
}

export function CheckoutSummary({
  checkout,
  isConfirming,
  onConfirm,
}: {
  checkout: Checkout;
  isConfirming: boolean;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 rounded-md border border-neutral-200 p-4 text-sm">
        <h2 className="mb-1 font-semibold text-neutral-900">Dirección de envío</h2>
        <p className="text-neutral-600">{formatAddress(checkout.shippingAddress)}</p>
      </div>

      <div className="flex flex-col gap-1 rounded-md border border-neutral-200 p-4 text-sm">
        <h2 className="mb-1 font-semibold text-neutral-900">Método de envío</h2>
        <p className="text-neutral-600">
          {checkout.shippingMethod
            ? `${checkout.shippingMethod.name} (${checkout.shippingMethod.estimatedDaysMin}-${checkout.shippingMethod.estimatedDaysMax} días)`
            : '—'}
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-4">
        {checkout.cart.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-neutral-600">
              {item.productName} ({item.variantTitle}) × {item.quantity}
            </span>
            <span className="text-neutral-900">{formatPrice(item.subtotal)}</span>
          </div>
        ))}
        <div className="mt-2 flex flex-col gap-1 border-t border-neutral-200 pt-2 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Subtotal</span>
            <span>{formatPrice(checkout.cart.subtotal)}</span>
          </div>
          {checkout.cart.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Descuento</span>
              <span className="text-danger-600">-{formatPrice(checkout.cart.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-neutral-500">Envío</span>
            <span>{formatPrice(checkout.shippingCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">IVA (16%)</span>
            <span>{formatPrice(checkout.taxAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-1 text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(checkout.grandTotal)}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-neutral-400">
        El pago se procesará en un paso posterior (022-Payments). Al confirmar, se genera tu pedido
        con este total.
      </p>

      <Button onClick={onConfirm} isLoading={isConfirming} className="self-start">
        Confirmar pedido
      </Button>
    </div>
  );
}
