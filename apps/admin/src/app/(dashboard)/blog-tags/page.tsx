'use client';

import type { BlogTag } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, DataTable, FormField, Input } from '@mijersey/ui';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

/** CRUD mínimo de etiquetas de blog (spec 027 §3: id/name/slug). */
export default function BlogTagsPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [tags, setTags] = useState<BlogTag[] | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setTags(await client.listBlogTags(accessToken));
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar las etiquetas.',
      );
    }
  }, [client, accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await client.createBlogTag(accessToken, { name, slug });
      setName('');
      setSlug('');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear la etiqueta.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    setError(null);
    try {
      await client.deleteBlogTag(accessToken, id);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar la etiqueta.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Etiquetas de blog</h1>
        <Link href="/blog-posts" className="text-brand-600 text-sm hover:underline">
          Volver a artículos
        </Link>
      </div>

      <form
        onSubmit={(event) => void handleCreate(event)}
        className="flex flex-wrap items-end gap-4 rounded-md border border-neutral-200 p-4"
      >
        <FormField label="Nombre" htmlFor="tag-name">
          <Input id="tag-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>
        <FormField label="Slug" htmlFor="tag-slug">
          <Input id="tag-slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </FormField>
        <Button type="submit" isLoading={isSubmitting}>
          Crear
        </Button>
      </form>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <DataTable<BlogTag>
        isLoading={!tags}
        rows={tags ?? []}
        getRowKey={(tag) => tag.id}
        emptyTitle="Sin etiquetas"
        columns={[
          { key: 'name', header: 'Nombre', render: (tag) => tag.name },
          { key: 'slug', header: 'Slug', render: (tag) => tag.slug },
          {
            key: 'actions',
            header: '',
            render: (tag) => (
              <button
                type="button"
                onClick={() => void handleDelete(tag.id)}
                className="text-danger-600 text-sm hover:underline"
              >
                Eliminar
              </button>
            ),
          },
        ]}
      />
    </div>
  );
}
