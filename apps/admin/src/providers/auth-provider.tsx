'use client';

import type { AuthenticatedUser, LoginInput } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { env } from '../config/env';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthenticatedUser>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
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
    async (input: LoginInput): Promise<AuthenticatedUser> => {
      const session = await client.login(input);
      setUser(session.user);
      setAccessToken(session.accessToken);
      return session.user;
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

  const hasPermission = useCallback(
    (permission: string) => user?.permissions.includes(permission) ?? false,
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, accessToken, isLoading, login, logout, hasPermission }),
    [user, accessToken, isLoading, login, logout, hasPermission],
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
