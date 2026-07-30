'use client';

import { useState } from 'react';

import { useCart } from '../../providers/cart-provider';
import { CartDrawer } from './CartDrawer';

/** Botón flotante (Mini Cart, spec §6) que abre el `CartDrawer` — reemplazo provisional de un ícono de carrito en el header mientras no exista un header compartido (028-Navigation-Builder). Montado una vez en el layout raíz. */
export function CartLauncher() {
  const { itemCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg"
        aria-label="Abrir carrito"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {itemCount > 0 && (
          <span className="bg-danger-600 absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white">
            {itemCount}
          </span>
        )}
      </button>
      {isOpen && <CartDrawer onClose={() => setIsOpen(false)} />}
    </>
  );
}
