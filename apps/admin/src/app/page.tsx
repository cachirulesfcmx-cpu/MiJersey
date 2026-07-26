'use client';

import { Button } from '@mijersey/ui';
import Link from 'next/link';

import { useAuth } from '../providers/auth-provider';

export default function AdminHomePage() {
  const { user, isLoading, logout } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-semibold text-neutral-900">MiJersey Admin</h1>

      {isLoading && <p className="text-sm text-neutral-400">Cargando…</p>}

      {!isLoading && !user && (
        <>
          <p className="text-neutral-500">Panel administrativo en construcción.</p>
          <Link href="/login" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
            Iniciar sesión
          </Link>
        </>
      )}

      {!isLoading && user && (
        <>
          <p className="text-neutral-500">
            Sesión iniciada como {user.firstName} ({user.role}).
          </p>
          <Button variant="secondary" onClick={() => void logout()}>
            Cerrar sesión
          </Button>
        </>
      )}
    </main>
  );
}
