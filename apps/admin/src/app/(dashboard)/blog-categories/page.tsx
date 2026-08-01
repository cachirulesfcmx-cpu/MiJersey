'use client';

import type { BlogCategory } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, DataTable, FormField, Input } from '@mijersey/ui';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

/** CRUD mínimo de categorías de blog (spec 027 §3: id/name/slug) — misma simplicidad que la entidad. */
export default function BlogCategoriesPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [categories, setCategories] = useState<BlogCategory[] | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setCategories(await client.listBlogCategories(accessToken));
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar las categorías.',
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
      await client.createBlogCategory(accessToken, { name, slug });
      setName('');
      setSlug('');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear la categoría.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    setError(null);
    try {
      await client.deleteBlogCategory(accessToken, id);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar la categoría.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Categorías de blog</h1>
        <Link href="/blog-posts" className="text-brand-600 text-sm hover:underline">
          Volver a artículos
        </Link>
      </div>

      <form
        onSubmit={(event) => void handleCreate(event)}
        className="flex flex-wrap items-end gap-4 rounded-md border border-neutral-200 p-4"
      >
        <FormField label="Nombre" htmlFor="category-name">
          <Input
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Slug" htmlFor="category-slug">
          <Input
            id="category-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </FormField>
        <Button type="submit" isLoading={isSubmitting}>
          Crear
        </Button>
      </form>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <DataTable<BlogCategory>
        isLoading={!categories}
        rows={categories ?? []}
        getRowKey={(category) => category.id}
        emptyTitle="Sin categorías"
        columns={[
          { key: 'name', header: 'Nombre', render: (category) => category.name },
          { key: 'slug', header: 'Slug', render: (category) => category.slug },
          {
            key: 'actions',
            header: '',
            render: (category) => (
              <button
                type="button"
                onClick={() => void handleDelete(category.id)}
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
