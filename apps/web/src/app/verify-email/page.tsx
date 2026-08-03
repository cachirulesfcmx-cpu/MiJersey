'use client';

import { ApiClient, ApiClientError } from '@mijersey/sdk';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

import { AuthCard } from '../../components/ui/AuthCard';
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

  const title =
    status === 'pending'
      ? 'Verificando…'
      : status === 'success'
        ? 'Correo verificado'
        : 'No se pudo verificar';

  return (
    <AuthCard title={title}>
      <div className="flex flex-col items-center gap-4 text-center">
        {status === 'pending' && (
          <>
            <span className="border-t-pop-500 h-8 w-8 animate-spin rounded-full border-2 border-neutral-200" />
            <p className="text-sm text-neutral-500">Verificando tu correo electrónico…</p>
          </>
        )}

        {status === 'success' && (
          <p className="text-sm text-neutral-500">Ya puedes iniciar sesión.</p>
        )}

        {status === 'error' && (
          <p className="text-danger-600 text-sm">
            {message ?? 'El enlace es inválido o ya expiró.'}
          </p>
        )}

        <Link href="/login" className="link-underline text-sm font-medium">
          Ir a iniciar sesión
        </Link>
      </div>
    </AuthCard>
  );
}
