'use client';

import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';

/** Creación de una página CMS (spec 026 §7 "POST /cms/pages") — nace en `DRAFT`; los bloques se agregan luego en el editor. */
export default function NewCmsPagePage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const page = await client.createPage(accessToken, { title, slug });
      router.push(`/cms-pages/${page.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear la página.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Nueva página</h1>

      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
        <FormField label="Título" htmlFor="page-title">
          <Input
            id="page-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </FormField>

        <FormField label="Slug" htmlFor="page-slug" hint="Minúsculas, números y guiones">
          <Input
            id="page-slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            required
          />
        </FormField>

        {error && <p className="text-danger-600 text-sm">{error}</p>}

        <Button type="submit" isLoading={isSubmitting} className="self-start">
          Crear página
        </Button>
      </form>
    </div>
  );
}
