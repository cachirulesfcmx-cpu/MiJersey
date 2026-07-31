'use client';

import type { WishlistItemView } from '@mijersey/sdk';
import Link from 'next/link';
import { useState } from 'react';

function formatPrice(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

/** Spec §6 "Wishlist Item" + "Move To Cart" — item individual con acciones de quitar y mover al carrito. `isAvailable` viene calculado en caliente por el backend (spec §4 "si un producto deja de existir, deberá marcarse como no disponible"). */
export function WishlistItemCard({
  item,
  onRemove,
  onMoveToCart,
}: {
  item: WishlistItemView;
  onRemove: (itemId: string) => Promise<void>;
  onMoveToCart?: (itemId: string) => Promise<void>;
}) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  async function handleRemove() {
    setIsRemoving(true);
    try {
      await onRemove(item.id);
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleMoveToCart() {
    if (!onMoveToCart) return;
    setIsMoving(true);
    try {
      await onMoveToCart(item.id);
    } finally {
      setIsMoving(false);
    }
  }

  return (
    <div className="flex gap-3 border-b border-neutral-200 py-4">
      <Link
        href={`/products/${item.productSlug}`}
        className="h-20 w-20 shrink-0 rounded-md bg-neutral-50"
      >
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.productName}
            loading="lazy"
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
        <span className="text-sm font-medium text-neutral-900">{formatPrice(item.price)}</span>

        {!item.isAvailable && (
          <span className="text-danger-600 text-xs">Este producto ya no está disponible</span>
        )}
        {item.isAvailable && item.availableQuantity === 0 && (
          <span className="text-danger-600 text-xs">Agotado</span>
        )}

        <div className="mt-2 flex items-center gap-3">
          {onMoveToCart && (
            <button
              type="button"
              disabled={!item.isAvailable || item.availableQuantity === 0 || isMoving}
              onClick={() => void handleMoveToCart()}
              className="bg-brand-600 hover:bg-brand-700 rounded-md px-3 py-1.5 text-xs font-medium text-white disabled:bg-neutral-300 disabled:text-neutral-600"
            >
              Mover al carrito
            </button>
          )}
          <button
            type="button"
            disabled={isRemoving}
            onClick={() => void handleRemove()}
            className="text-danger-600 text-xs hover:underline disabled:opacity-50"
          >
            Quitar
          </button>
        </div>
      </div>
    </div>
  );
}
