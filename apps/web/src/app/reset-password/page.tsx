'use client';

import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { type FormEvent, Suspense, useMemo, useState } from 'react';

import { env } from '../../config/env';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await client.resetPassword({ token, newPassword });
      setIsDone(true);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudo restablecer la contraseña.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Enlace inválido</h1>
        <p className="text-sm text-neutral-500">Solicita un nuevo enlace de recuperación.</p>
        <Link
          href="/forgot-password"
          className="text-brand-600 hover:text-brand-700 text-sm font-medium"
        >
          Recuperar contraseña
        </Link>
      </main>
    );
  }

  if (isDone) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Contraseña actualizada</h1>
        <p className="text-sm text-neutral-500">
          Ya puedes iniciar sesión con tu nueva contraseña.
        </p>
        <Link href="/login" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
          Iniciar sesión
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Nueva contraseña</h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField label="Contraseña nueva" htmlFor="newPassword" hint="Mínimo 8 caracteres">
          <Input
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </FormField>

        {error && (
          <p role="alert" className="text-danger-600 text-sm">
            {error}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting}>
          Restablecer contraseña
        </Button>
      </form>
    </main>
  );
}
