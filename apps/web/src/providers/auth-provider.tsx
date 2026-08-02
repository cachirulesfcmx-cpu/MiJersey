'use client';

import type { RegisterInput, UserProfile } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { env } from '../config/env';

interface AuthContextValue {
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    client
      .refresh()
      .then((session) => {
        if (cancelled) return;
        setUser(session.user);
        setAccessToken(session.accessToken);
      })
      .catch(() => {
        // No hay sesión activa: se continúa como invitado.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [client]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await client.login({ email, password });
      // El storefront es solo para clientes, y un cliente nunca puede activar MFA (035) —
      // este caso no debería alcanzarse en la práctica.
      if (result.mfaRequired) {
        throw new Error('Esta cuenta requiere verificación en dos pasos, no disponible aquí.');
      }
      setUser(result.user);
      setAccessToken(result.accessToken);
    },
    [client],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      await client.register(input);
    },
    [client],
  );

  const logout = useCallback(async () => {
    if (accessToken) {
      await client.logout(accessToken).catch(() => undefined);
    }
    setUser(null);
    setAccessToken(null);
  }, [client, accessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, accessToken, isLoading, login, register, logout }),
    [user, accessToken, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }

  return ctx;
}
