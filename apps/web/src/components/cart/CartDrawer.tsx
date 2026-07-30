'use client';

import Link from 'next/link';

import { useCart } from '../../providers/cart-provider';
import { CartItemRow } from './CartItemRow';
import { OrderSummary } from './OrderSummary';

/** Cart Drawer (spec §6) — panel deslizable con el contenido del Mini Cart; se abre desde el botón flotante `CartLauncher` (todavía no existe un header compartido, ver docs/shopping-cart.md). */
export function CartDrawer({ onClose }: { onClose: () => void }) {
  const { cart, isLoading, updateItem, removeItem } = useCart();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Cerrar carrito"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-sm flex-col gap-4 overflow-y-auto bg-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Tu carrito</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900"
          >
            ×
          </button>
        </div>

        {isLoading || !cart ? (
          <p className="text-sm text-neutral-500">Cargando…</p>
        ) : cart.items.length === 0 ? (
          <p className="text-sm text-neutral-500">Tu carrito está vacío.</p>
        ) : (
          <>
            <div className="flex flex-1 flex-col">
              {cart.items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateItem}
                  onRemove={removeItem}
                />
              ))}
            </div>
            <OrderSummary cart={cart} />
            <Link
              href="/cart"
              onClick={onClose}
              className="rounded-md border border-neutral-300 px-4 py-2 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Ver carrito completo
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
