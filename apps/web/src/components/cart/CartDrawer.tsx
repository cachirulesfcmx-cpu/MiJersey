'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useCart } from '../../providers/cart-provider';
import { CartItemRow } from './CartItemRow';
import { OrderSummary } from './OrderSummary';

/** Cart Drawer (spec §6) — panel deslizable con el contenido del Mini Cart; se abre desde el botón flotante `CartLauncher` (todavía no existe un header compartido, ver docs/shopping-cart.md). */
export function CartDrawer({ onClose }: { onClose: () => void }) {
  const { cart, isLoading, updateItem, removeItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsOpen(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function handleClose() {
    setIsOpen(false);
    setTimeout(onClose, 200);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Cerrar carrito"
        className={`bg-arena-950/50 absolute inset-0 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      <div
        className={`relative flex h-full w-full max-w-sm flex-col gap-4 overflow-y-auto bg-white p-5 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="section-heading text-xl">Tu carrito</h2>
          <button
            type="button"
            onClick={handleClose}
            className="hover:text-arena-900 flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100"
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
            <div className="flex flex-1 flex-col gap-3">
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
            <Link href="/cart" onClick={handleClose} className="btn-pop-outline">
              Ver carrito completo
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
