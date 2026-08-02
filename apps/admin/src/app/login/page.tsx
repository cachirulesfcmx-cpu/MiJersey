'use client';

import { ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { useAuth } from '../../providers/auth-provider';

export default function LoginPage() {
  const { login, completeMfaLogin, logout } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login({ email, password });

      if (result.mfaRequired) {
        setChallengeToken(result.challengeToken);
        return;
      }

      if (result.user.role === 'CUSTOMER') {
        await logout();
        setError('Esta cuenta no tiene acceso al panel administrativo.');
        return;
      }

      router.push('/');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMfaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challengeToken) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await completeMfaLogin(challengeToken, mfaCode);

      if (user.role === 'CUSTOMER') {
        await logout();
        setError('Esta cuenta no tiene acceso al panel administrativo.');
        return;
      }

      router.push('/');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Código de verificación inválido.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (challengeToken) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Verificación en dos pasos</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Ingresa el código de 6 dígitos de tu aplicación de autenticación.
          </p>
        </div>

        <form onSubmit={handleMfaSubmit} noValidate className="flex flex-col gap-4">
          <FormField label="Código de verificación" htmlFor="mfa-code">
            <Input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={mfaCode}
              onChange={(event) => setMfaCode(event.target.value)}
            />
          </FormField>

          {error && (
            <p role="alert" className="text-danger-600 text-sm">
              {error}
            </p>
          )}

          <Button type="submit" isLoading={isSubmitting}>
            Verificar
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setChallengeToken(null);
              setMfaCode('');
              setError(null);
            }}
          >
            Volver
          </Button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Panel administrativo</h1>

      <form onSubmit={handlePasswordSubmit} noValidate className="flex flex-col gap-4">
        <FormField label="Correo electrónico" htmlFor="email">
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>

        <FormField label="Contraseña" htmlFor="password">
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>

        {error && (
          <p role="alert" className="text-danger-600 text-sm">
            {error}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting}>
          Entrar
        </Button>
      </form>
    </main>
  );
}
