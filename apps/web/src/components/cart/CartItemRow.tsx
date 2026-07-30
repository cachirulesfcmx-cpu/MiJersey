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
    <div className="flex gap-3 border-b border-neutral-200 py-4">
      <Link
        href={`/products/${item.productSlug}`}
        className="h-16 w-16 shrink-0 rounded-md bg-neutral-50"
      >
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.productName}
            className="h-full w-full rounded-md object-cover"
          />
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <Link
          href={`/products/${item.productSlug}`}
          className="text-sm font-medium text-neutral-900"
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
            className="h-6 w-6 rounded border border-neutral-200 text-sm disabled:opacity-30"
            disabled={isUpdating || item.quantity <= 1}
            onClick={() => void handleQuantityChange(item.quantity - 1)}
          >
            −
          </button>
          <span className="w-6 text-center text-sm">{item.quantity}</span>
          <button
            type="button"
            className="h-6 w-6 rounded border border-neutral-200 text-sm disabled:opacity-30"
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

      <span className="text-sm font-medium text-neutral-900">{formatPrice(item.subtotal)}</span>
    </div>
  );
}
