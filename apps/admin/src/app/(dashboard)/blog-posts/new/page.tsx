'use client';

import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';

/** Creación mínima de un artículo (spec 027 §7 "POST /blog/posts") — nace en `DRAFT`, con el usuario autenticado como autor; el resto del contenido (extracto, categorías, etiquetas, SEO) se completa luego en el editor. */
export default function NewBlogPostPage() {
  const { accessToken, user } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken || !user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const post = await client.createPost(accessToken, {
        title,
        slug,
        content,
        authorId: user.id,
      });
      router.push(`/blog-posts/${post.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear el artículo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Nuevo artículo</h1>

      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
        <FormField label="Título" htmlFor="post-title">
          <Input
            id="post-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </FormField>

        <FormField label="Slug" htmlFor="post-slug" hint="Minúsculas, números y guiones">
          <Input
            id="post-slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            required
          />
        </FormField>

        <FormField label="Contenido" htmlFor="post-content">
          <textarea
            id="post-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={8}
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </FormField>

        {error && <p className="text-danger-600 text-sm">{error}</p>}

        <Button type="submit" isLoading={isSubmitting} className="self-start">
          Crear artículo
        </Button>
      </form>
    </div>
  );
}
