'use client';

import type { AddCartItemInput, Cart } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { env } from '../config/env';
import { useAuth } from './auth-provider';

const SESSION_STORAGE_KEY = 'mijersey-cart-session-id';

/** Id anónimo persistido en localStorage — identifica "el" carrito del visitante entre sesiones (spec §2) hasta que exista sesión de invitado a nivel de backend. */
function getOrCreateCartSessionId(): string {
  if (typeof window === 'undefined') return '';
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const sessionId = crypto.randomUUID();
  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

interface CartContextValue {
  cart: Cart | null;
  /** Mismo id de sesión que identifica "el" carrito del visitante — 018-Checkout lo reutiliza para que su `CheckoutSession` resuelva el mismo carrito. */
  sessionId: string;
  isLoading: boolean;
  error: string | null;
  itemCount: number;
  addItem: (input: AddCartItemInput) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const { accessToken } = useAuth();
  const [sessionId, setSessionId] = useState('');
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousAccessToken = useRef<string | null>(null);

  useEffect(() => {
    setSessionId(getOrCreateCartSessionId());
  }, []);

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    try {
      setCart(await client.getCart(sessionId, accessToken ?? undefined));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el carrito.');
    } finally {
      setIsLoading(false);
    }
  }, [client, sessionId, accessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Fusión de carritos al iniciar sesión (spec §4) — se dispara una sola vez, justo cuando
  // `accessToken` pasa de ausente a presente (login/registro con sesión ya iniciada).
  useEffect(() => {
    if (!sessionId) return;
    const wasLoggedOut = !previousAccessToken.current;
    previousAccessToken.current = accessToken;
    if (!wasLoggedOut || !accessToken) return;

    client
      .mergeCart(sessionId, accessToken)
      .then(setCart)
      .catch(() => undefined);
  }, [accessToken, sessionId, client]);

  const addItem = useCallback(
    async (input: AddCartItemInput) => {
      setError(null);
      try {
        setCart(await client.addCartItem(sessionId, input, accessToken ?? undefined));
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'No se pudo agregar el producto.');
        throw err;
      }
    },
    [client, sessionId, accessToken],
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      setError(null);
      try {
        setCart(await client.updateCartItem(sessionId, itemId, quantity, accessToken ?? undefined));
      } catch (err) {
        setError(
          err instanceof ApiClientError ? err.message : 'No se pudo actualizar la cantidad.',
        );
        throw err;
      }
    },
    [client, sessionId, accessToken],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      setError(null);
      try {
        setCart(await client.removeCartItem(sessionId, itemId, accessToken ?? undefined));
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'No se pudo quitar el producto.');
        throw err;
      }
    },
    [client, sessionId, accessToken],
  );

  const applyCoupon = useCallback(
    async (code: string) => {
      setError(null);
      try {
        setCart(await client.applyCartCoupon(sessionId, code, accessToken ?? undefined));
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'No se pudo aplicar el cupón.');
        throw err;
      }
    },
    [client, sessionId, accessToken],
  );

  const removeCoupon = useCallback(async () => {
    setError(null);
    try {
      setCart(await client.removeCartCoupon(sessionId, accessToken ?? undefined));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo quitar el cupón.');
      throw err;
    }
  }, [client, sessionId, accessToken]);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      sessionId,
      isLoading,
      error,
      itemCount,
      addItem,
      updateItem,
      removeItem,
      applyCoupon,
      removeCoupon,
      refresh,
    }),
    [
      cart,
      sessionId,
      isLoading,
      error,
      itemCount,
      addItem,
      updateItem,
      removeItem,
      applyCoupon,
      removeCoupon,
      refresh,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error('useCart debe usarse dentro de <CartProvider>');
  }

  return ctx;
}
