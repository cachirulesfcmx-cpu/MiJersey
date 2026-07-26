'use client';

import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import Link from 'next/link';
import { type FormEvent, useMemo, useState } from 'react';

import { env } from '../../config/env';

export default function ForgotPasswordPage() {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await client.forgotPassword(email);
      setIsDone(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo procesar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isDone) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Revisa tu correo</h1>
        <p className="text-sm text-neutral-500">
          Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu contraseña.
        </p>
        <Link href="/login" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
          Volver a iniciar sesión
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Recuperar contraseña</h1>
      <p className="text-sm text-neutral-500">
        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField label="Correo electrónico" htmlFor="email">
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>

        {error && (
          <p role="alert" className="text-danger-600 text-sm">
            {error}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting}>
          Enviar enlace
        </Button>
      </form>

      <Link href="/login" className="text-center text-sm text-neutral-500 hover:text-neutral-900">
        Volver a iniciar sesión
      </Link>
    </main>
  );
}
