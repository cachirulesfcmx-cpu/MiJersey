'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '../../providers/auth-provider';
import { useWishlist } from '../../providers/wishlist-provider';

/** Botón reutilizable (spec §6 "Wishlist Button") para agregar/quitar una variante de la lista de deseos — usado en la PDP. Sin sesión, redirige a login en vez de fallar silenciosamente (spec §9 "autenticación obligatoria"). */
export function WishlistButton({
  productId,
  variantId,
  className = '',
}: {
  productId: string;
  variantId: string;
  className?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { isInWishlist, addItem, removeItem, wishlist } = useWishlist();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const active = isInWishlist(variantId);

  async function handleClick() {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsSubmitting(true);
    try {
      if (active) {
        const item = wishlist?.items.find((entry) => entry.variantId === variantId);
        if (item) await removeItem(item.id);
      } else {
        await addItem({ productId, variantId });
      }
    } catch {
      // El error ya queda expuesto vía `useWishlist().error`.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={isSubmitting}
      aria-pressed={active}
      aria-label={active ? 'Quitar de mi lista de deseos' : 'Agregar a mi lista de deseos'}
      className={`flex h-10 w-10 items-center justify-center rounded-md border disabled:opacity-50 ${
        active
          ? 'border-danger-200 bg-danger-50 text-danger-600'
          : 'border-neutral-300 text-neutral-700'
      } ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        className="h-5 w-5"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    </button>
  );
}
