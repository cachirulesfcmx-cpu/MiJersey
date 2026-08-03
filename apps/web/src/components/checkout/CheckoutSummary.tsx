'use client';

import type { Checkout } from '@mijersey/sdk';
import { Button } from '@mijersey/ui';

import { PRIMARY_BUTTON_OVERRIDE_CLASS } from '../ui/form-styles';

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
      <div className="card-arena flex flex-col gap-1 text-sm">
        <h2 className="label-arena mb-1">Dirección de envío</h2>
        <p className="text-neutral-600">{formatAddress(checkout.shippingAddress)}</p>
      </div>

      <div className="card-arena flex flex-col gap-1 text-sm">
        <h2 className="label-arena mb-1">Método de envío</h2>
        <p className="text-neutral-600">
          {checkout.shippingMethod
            ? `${checkout.shippingMethod.name} (${checkout.shippingMethod.estimatedDaysMin}-${checkout.shippingMethod.estimatedDaysMax} días)`
            : '—'}
        </p>
      </div>

      <div className="card-arena flex flex-col gap-2">
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
          <div className="flex justify-between border-t border-neutral-200 pt-2">
            <span className="font-display text-arena-950 text-lg uppercase tracking-wide">
              Total
            </span>
            <span className="font-display text-pop-600 text-lg tracking-wide">
              {formatPrice(checkout.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-neutral-400">
        Al confirmar, se genera tu pedido con este total y podrás elegir cómo pagarlo.
      </p>

      <Button
        onClick={onConfirm}
        isLoading={isConfirming}
        className={`!self-start ${PRIMARY_BUTTON_OVERRIDE_CLASS}`}
      >
        Confirmar pedido
      </Button>
    </div>
  );
}
