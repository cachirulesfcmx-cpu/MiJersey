'use client';

import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';

/** Creación mínima de un menú (spec 028 §7 "POST /navigation/menus") — nace en `DRAFT` sin ítems; el árbol se arma luego en el Tree Editor. */
export default function NewNavigationMenuPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const router = useRouter();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const menu = await client.createNavigationMenu(accessToken, { name, location });
      router.push(`/navigation-menus/${menu.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear el menú.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Nuevo menú</h1>

      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
        <FormField label="Nombre" htmlFor="menu-name">
          <Input id="menu-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>

        <FormField
          label="Ubicación"
          htmlFor="menu-location"
          hint="Identificador libre, p. ej. header, footer, mobile"
        >
          <Input
            id="menu-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </FormField>

        {error && <p className="text-danger-600 text-sm">{error}</p>}

        <Button type="submit" isLoading={isSubmitting} className="self-start">
          Crear menú
        </Button>
      </form>
    </div>
  );
}
