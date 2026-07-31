'use client';

import type { Wishlist } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { env } from '../config/env';
import { useAuth } from './auth-provider';
import { useCart } from './cart-provider';

interface WishlistContextValue {
  wishlist: Wishlist | null;
  isLoading: boolean;
  error: string | null;
  isInWishlist: (variantId: string) => boolean;
  addItem: (input: { productId: string; variantId: string }) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  moveItemToCart: (itemId: string) => Promise<void>;
  shareWishlist: () => Promise<string>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

/** Spec §9 "autenticación obligatoria" — a diferencia de `CartProvider`, no hay estado de invitado: sin `accessToken` la wishlist simplemente permanece `null` y las acciones no hacen nada (la UI debe redirigir a login, ver `WishlistButton`). */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const { accessToken } = useAuth();
  const { sessionId, refresh: refreshCart } = useCart();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setWishlist(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      setWishlist(await client.getWishlist(accessToken));
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudo cargar tu lista de deseos.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [client, accessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isInWishlist = useCallback(
    (variantId: string) => wishlist?.items.some((item) => item.variantId === variantId) ?? false,
    [wishlist],
  );

  const addItem = useCallback(
    async (input: { productId: string; variantId: string }) => {
      if (!accessToken) return;
      setError(null);
      try {
        setWishlist(await client.addWishlistItem(accessToken, input));
      } catch (err) {
        setError(
          err instanceof ApiClientError ? err.message : 'No se pudo agregar a la lista de deseos.',
        );
        throw err;
      }
    },
    [client, accessToken],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!accessToken) return;
      setError(null);
      try {
        setWishlist(await client.removeWishlistItem(accessToken, itemId));
      } catch (err) {
        setError(
          err instanceof ApiClientError ? err.message : 'No se pudo quitar de la lista de deseos.',
        );
        throw err;
      }
    },
    [client, accessToken],
  );

  const moveItemToCart = useCallback(
    async (itemId: string) => {
      if (!accessToken || !sessionId) return;
      setError(null);
      try {
        setWishlist(await client.moveWishlistItemToCart(accessToken, itemId, sessionId));
        await refreshCart();
      } catch (err) {
        setError(
          err instanceof ApiClientError ? err.message : 'No se pudo mover el producto al carrito.',
        );
        throw err;
      }
    },
    [client, accessToken, sessionId, refreshCart],
  );

  const shareWishlist = useCallback(async () => {
    if (!accessToken) throw new Error('Debes iniciar sesión para compartir tu lista de deseos.');
    const { shareToken } = await client.shareWishlist(accessToken);
    setWishlist((prev) => (prev ? { ...prev, shareToken } : prev));
    return shareToken;
  }, [client, accessToken]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      wishlist,
      isLoading,
      error,
      isInWishlist,
      addItem,
      removeItem,
      moveItemToCart,
      shareWishlist,
      refresh,
    }),
    [
      wishlist,
      isLoading,
      error,
      isInWishlist,
      addItem,
      removeItem,
      moveItemToCart,
      shareWishlist,
      refresh,
    ],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);

  if (!ctx) {
    throw new Error('useWishlist debe usarse dentro de <WishlistProvider>');
  }

  return ctx;
}
