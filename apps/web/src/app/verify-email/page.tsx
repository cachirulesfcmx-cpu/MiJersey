'use client';

import { ApiClient, ApiClientError } from '@mijersey/sdk';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';

type Status = 'pending' | 'success' | 'error';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailStatus />
    </Suspense>
  );
}

function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [status, setStatus] = useState<Status>(token ? 'pending' : 'error');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    client
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        setStatus('error');
        setMessage(err instanceof ApiClientError ? err.message : 'No se pudo verificar el correo.');
      });
  }, [client, token]);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6 text-center">
      {status === 'pending' && (
        <p className="text-sm text-neutral-500">Verificando tu correo electrónico…</p>
      )}

      {status === 'success' && (
        <>
          <h1 className="text-2xl font-semibold text-neutral-900">Correo verificado</h1>
          <p className="text-sm text-neutral-500">Ya puedes iniciar sesión.</p>
        </>
      )}

      {status === 'error' && (
        <>
          <h1 className="text-2xl font-semibold text-neutral-900">No se pudo verificar</h1>
          <p className="text-danger-600 text-sm">
            {message ?? 'El enlace es inválido o ya expiró.'}
          </p>
        </>
      )}

      <Link href="/login" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
        Ir a iniciar sesión
      </Link>
    </main>
  );
}
