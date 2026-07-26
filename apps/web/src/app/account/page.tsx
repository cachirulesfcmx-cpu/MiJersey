'use client';

import type { SessionSummary } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, Skeleton } from '@mijersey/ui';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';
import { useAuth } from '../../providers/auth-provider';

export default function AccountPage() {
  const { user, accessToken, isLoading, logout } = useAuth();
  const router = useRouter();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!accessToken) return;

    try {
      const result = await client.listSessions(accessToken);
      setSessions(result);
    } catch (err) {
      setSessionsError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar las sesiones.',
      );
    }
  }, [client, accessToken]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  async function handleRevoke(sessionId: string) {
    if (!accessToken) return;
    await client.revokeSession(accessToken, sessionId);
    await loadSessions();
  }

  async function handleRevokeAll() {
    if (!accessToken) return;
    await client.revokeAllSessions(accessToken);
    await loadSessions();
  }

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  if (isLoading || !user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-neutral-500">{user.email}</p>
          {!user.isEmailVerified && (
            <p className="text-warning-600 mt-1 text-xs">Tu correo aún no está verificado.</p>
          )}
        </div>
        <Button variant="secondary" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-neutral-900">Sesiones activas</h2>
          <Button variant="ghost" onClick={handleRevokeAll}>
            Cerrar todas las demás
          </Button>
        </div>

        {sessionsError && <p className="text-danger-600 text-sm">{sessionsError}</p>}

        {!sessions && !sessionsError && (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}

        {sessions && sessions.length === 0 && (
          <p className="text-sm text-neutral-500">No hay sesiones activas.</p>
        )}

        <ul className="flex flex-col gap-2">
          {sessions?.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 p-3 text-sm"
            >
              <div>
                <p className="font-medium text-neutral-900">
                  {session.userAgent ?? 'Dispositivo desconocido'}
                  {session.isCurrent && (
                    <span className="text-brand-600 ml-2 text-xs">(esta sesión)</span>
                  )}
                </p>
                <p className="text-xs text-neutral-500">
                  Último uso: {new Date(session.lastUsedAt).toLocaleString('es-MX')}
                </p>
              </div>
              {!session.isCurrent && (
                <Button variant="ghost" onClick={() => handleRevoke(session.id)}>
                  Revocar
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
