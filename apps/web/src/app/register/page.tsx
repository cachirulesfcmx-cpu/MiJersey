'use client';

import { ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import Link from 'next/link';
import { type ChangeEvent, type FormEvent, useState } from 'react';

import { useAuth } from '../../providers/auth-provider';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  function updateField(field: keyof typeof form) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register(form);
      setIsDone(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo completar el registro.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isDone) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Revisa tu correo</h1>
        <p className="text-sm text-neutral-500">
          Te enviamos un enlace para verificar tu cuenta antes de iniciar sesión.
        </p>
        <Link href="/login" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
          Volver a iniciar sesión
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Crear cuenta</h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField label="Nombre" htmlFor="firstName">
          <Input
            autoComplete="given-name"
            required
            value={form.firstName}
            onChange={updateField('firstName')}
          />
        </FormField>

        <FormField label="Apellido" htmlFor="lastName">
          <Input
            autoComplete="family-name"
            required
            value={form.lastName}
            onChange={updateField('lastName')}
          />
        </FormField>

        <FormField label="Correo electrónico" htmlFor="email">
          <Input
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={updateField('email')}
          />
        </FormField>

        <FormField label="Contraseña" htmlFor="password" hint="Mínimo 8 caracteres">
          <Input
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={form.password}
            onChange={updateField('password')}
          />
        </FormField>

        {error && (
          <p role="alert" className="text-danger-600 text-sm">
            {error}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting}>
          Crear cuenta
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
