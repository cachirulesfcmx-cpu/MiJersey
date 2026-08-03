'use client';

import { ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { AUTH_BUTTON_CLASS, AUTH_INPUT_CLASS, AuthCard } from '../../components/ui/AuthCard';
import { useAuth } from '../../providers/auth-provider';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push('/account');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard title="Iniciar sesión">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField label="Correo electrónico" htmlFor="email">
          <Input
            type="email"
            autoComplete="email"
            required
            className={AUTH_INPUT_CLASS}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>

        <FormField label="Contraseña" htmlFor="password">
          <Input
            type="password"
            autoComplete="current-password"
            required
            className={AUTH_INPUT_CLASS}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>

        {error && (
          <p role="alert" className="text-danger-600 text-sm">
            {error}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className={AUTH_BUTTON_CLASS}>
          Entrar
        </Button>
      </form>

      <div className="mt-6 flex justify-between text-sm">
        <Link href="/forgot-password" className="link-underline">
          ¿Olvidaste tu contraseña?
        </Link>
        <Link href="/register" className="link-underline">
          Crear cuenta
        </Link>
      </div>
    </AuthCard>
  );
}
