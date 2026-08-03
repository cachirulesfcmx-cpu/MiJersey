'use client';

import type { Wishlist } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { EmptyWishlist } from '../../../../components/wishlist/EmptyWishlist';
import { env } from '../../../../config/env';
import { useCart } from '../../../../providers/cart-provider';

function formatPrice(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

/** Vista pública de solo lectura de una lista compartida (spec §2/§9 "validación de enlaces compartidos") — sin autenticación, resuelta por token vía `GET /wishlist/shared/:token`. Permite agregar artículos al carrito propio de quien la visita, no al carrito del dueño de la lista. */
export default function SharedWishlistPage() {
  const params = useParams<{ token: string }>();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const { addItem } = useCart();

  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedItemId, setAddedItemId] = useState<string | null>(null);

  useEffect(() => {
    client
      .getSharedWishlist(params.token)
      .then(setWishlist)
      .catch((err) => {
        setError(
          err instanceof ApiClientError ? err.message : 'No se pudo cargar esta lista de deseos.',
        );
      });
  }, [client, params.token]);

  async function handleAddToCart(itemId: string, variantId: string) {
    try {
      await addItem({ variantId, quantity: 1 });
      setAddedItemId(itemId);
    } catch {
      // El estado de error del carrito ya se refleja en su propio provider.
    }
  }

  if (error) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-10">
        <p className="text-danger-600 text-sm">{error}</p>
      </main>
    );
  }

  if (!wishlist) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-10">
        <p className="text-sm text-neutral-500">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="section-heading">{wishlist.name}</h1>

      {wishlist.items.length === 0 ? (
        <EmptyWishlist />
      ) : (
        <div className="flex flex-col gap-3">
          {wishlist.items.map((item) => (
            <div key={item.id} className="card-arena flex gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-50">
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col gap-1">
                <span className="text-sm font-medium text-neutral-900">{item.productName}</span>
                <span className="text-xs text-neutral-500">{item.variantTitle}</span>
                <span className="font-display text-pop-600 tracking-wide">
                  {formatPrice(item.price)}
                </span>
                {!item.isAvailable && (
                  <span className="text-danger-600 text-xs">Ya no está disponible</span>
                )}

                {item.isAvailable && item.availableQuantity > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleAddToCart(item.id, item.variantId)}
                    className="btn-pop-sm mt-2 self-start"
                  >
                    {addedItemId === item.id ? 'Agregado ✓' : 'Agregar al carrito'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
