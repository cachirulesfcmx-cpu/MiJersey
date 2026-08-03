'use client';

import type { CartItemView } from '@mijersey/sdk';
import Link from 'next/link';
import { useState } from 'react';

function formatPrice(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItemView;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleQuantityChange(quantity: number) {
    if (quantity < 1 || quantity > Math.max(item.availableQuantity, 1)) return;
    setIsUpdating(true);
    try {
      await onUpdateQuantity(item.id, quantity);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="card-arena flex gap-4">
      <Link
        href={`/products/${item.productSlug}`}
        className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-50"
      >
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <Link
          href={`/products/${item.productSlug}`}
          className="hover:text-pop-600 text-sm font-medium text-neutral-900"
        >
          {item.productName}
        </Link>
        <span className="text-xs text-neutral-500">{item.variantTitle}</span>
        {!item.inStock && (
          <span className="text-danger-600 text-xs">
            Solo quedan {item.availableQuantity} disponibles
          </span>
        )}

        <div className="mt-1 flex items-center gap-2">
          <button
            type="button"
            className="hover:border-pop-500 hover:text-pop-600 h-7 w-7 rounded-full border border-neutral-200 text-sm transition-colors disabled:opacity-30"
            disabled={isUpdating || item.quantity <= 1}
            onClick={() => void handleQuantityChange(item.quantity - 1)}
          >
            −
          </button>
          <span className="w-6 text-center text-sm">{item.quantity}</span>
          <button
            type="button"
            className="hover:border-pop-500 hover:text-pop-600 h-7 w-7 rounded-full border border-neutral-200 text-sm transition-colors disabled:opacity-30"
            disabled={isUpdating || item.quantity >= item.availableQuantity}
            onClick={() => void handleQuantityChange(item.quantity + 1)}
          >
            +
          </button>
          <button
            type="button"
            className="text-danger-600 ml-2 text-xs hover:underline"
            onClick={() => void onRemove(item.id)}
          >
            Quitar
          </button>
        </div>
      </div>

      <span className="font-display text-lg tracking-wide text-neutral-900">
        {formatPrice(item.subtotal)}
      </span>
    </div>
  );
}
