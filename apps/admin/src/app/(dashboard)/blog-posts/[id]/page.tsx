'use client';

import type { BlogCategory, BlogTag, Post, PostVersion } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';

/** Post Editor (spec 027 §6): título/slug/extracto/contenido/imagen destacada/SEO, categorías y etiquetas, Version History con restaurar, y publicación inmediata o programada — mismo patrón que el Page Editor de CMS Pages (026). */
export default function EditBlogPostPage({ params }: { params: { id: string } }) {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [post, setPost] = useState<Post | null>(null);
  const [versions, setVersions] = useState<PostVersion[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [publishAt, setPublishAt] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [postResult, versionsResult, categoriesResult, tagsResult] = await Promise.all([
        client.getPost(accessToken, params.id),
        client.listPostVersions(accessToken, params.id, { pageSize: 50 }),
        client.listBlogCategories(accessToken),
        client.listBlogTags(accessToken),
      ]);
      setPost(postResult);
      setVersions(versionsResult.items);
      setCategories(categoriesResult);
      setTags(tagsResult);
      setTitle(postResult.title);
      setSlug(postResult.slug);
      setExcerpt(postResult.excerpt ?? '');
      setContent(postResult.content);
      setFeaturedImage(postResult.featuredImage ?? '');
      setSeoTitle(postResult.seoTitle ?? '');
      setSeoDescription(postResult.seoDescription ?? '');
      setCategoryIds(postResult.categories.map((category) => category.id));
      setTagIds(postResult.tags.map((tag) => tag.id));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el artículo.');
    }
  }, [client, accessToken, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggle(list: string[], setList: (value: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((value) => value !== id) : [...list, id]);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await client.updatePost(accessToken, params.id, {
        title,
        slug,
        content,
        ...(excerpt ? { excerpt } : {}),
        ...(featuredImage ? { featuredImage } : {}),
        ...(seoTitle ? { seoTitle } : {}),
        ...(seoDescription ? { seoDescription } : {}),
        categoryIds,
        tagIds,
      });
      setSuccessMessage('Cambios guardados.');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar el artículo.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish() {
    if (!accessToken) return;
    setIsPublishing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await client.publishPost(
        accessToken,
        params.id,
        publishAt ? { publishAt: new Date(publishAt).toISOString() } : {},
      );
      setSuccessMessage(publishAt ? 'Publicación programada.' : 'Artículo publicado.');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo publicar el artículo.');
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleRestore(versionNumber: number) {
    if (!accessToken) return;
    setError(null);
    setSuccessMessage(null);
    try {
      await client.restorePostVersion(accessToken, params.id, versionNumber);
      setSuccessMessage(`Versión ${versionNumber} restaurada.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo restaurar la versión.');
    }
  }

  if (!post) return <p className="text-sm text-neutral-500">Cargando…</p>;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{post.title}</h1>
        <p className="text-sm text-neutral-500">
          Estado: {post.status} · Autor: {post.author.firstName} {post.author.lastName}
          {post.publishedAt && ` · ${new Date(post.publishedAt).toLocaleString('es-MX')}`}
        </p>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}
      {successMessage && <p className="text-success-600 text-sm">{successMessage}</p>}

      <form onSubmit={(event) => void handleSave(event)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Título" htmlFor="edit-title">
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormField>
          <FormField label="Slug" htmlFor="edit-slug">
            <Input id="edit-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </FormField>
        </div>

        <FormField label="Extracto" htmlFor="edit-excerpt">
          <Input id="edit-excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        </FormField>

        <FormField label="Contenido" htmlFor="edit-content">
          <textarea
            id="edit-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </FormField>

        <FormField label="Imagen destacada (URL)" htmlFor="edit-featured-image">
          <Input
            id="edit-featured-image"
            value={featuredImage}
            onChange={(e) => setFeaturedImage(e.target.value)}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="SEO — título" htmlFor="edit-seo-title">
            <Input
              id="edit-seo-title"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
          </FormField>
          <FormField label="SEO — descripción" htmlFor="edit-seo-description">
            <Input
              id="edit-seo-description"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3">
            <span className="text-sm font-semibold text-neutral-900">Categorías</span>
            {categories.length === 0 && (
              <p className="text-xs text-neutral-500">Sin categorías creadas todavía.</p>
            )}
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={categoryIds.includes(category.id)}
                  onChange={() => toggle(categoryIds, setCategoryIds, category.id)}
                />
                {category.name}
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3">
            <span className="text-sm font-semibold text-neutral-900">Etiquetas</span>
            {tags.length === 0 && (
              <p className="text-xs text-neutral-500">Sin etiquetas creadas todavía.</p>
            )}
            {tags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={tagIds.includes(tag.id)}
                  onChange={() => toggle(tagIds, setTagIds, tag.id)}
                />
                {tag.name}
              </label>
            ))}
          </div>
        </div>

        <Button type="submit" isLoading={isSaving} className="self-start">
          Guardar cambios
        </Button>
      </form>

      <div className="flex flex-wrap items-end gap-4 rounded-md border border-neutral-200 p-4">
        <FormField label="Programar para (opcional)" htmlFor="publish-at">
          <input
            id="publish-at"
            type="datetime-local"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </FormField>
        <Button onClick={() => void handlePublish()} isLoading={isPublishing}>
          {publishAt ? 'Programar publicación' : 'Publicar ahora'}
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-900">Historial de versiones</h2>
        <ul className="flex flex-col gap-2">
          {versions.map((version) => (
            <li
              key={version.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 p-3 text-sm"
            >
              <span>
                Versión {version.versionNumber} — {version.snapshot.title} (
                {new Date(version.createdAt).toLocaleString('es-MX')})
              </span>
              <button
                type="button"
                onClick={() => void handleRestore(version.versionNumber)}
                className="text-brand-600 hover:underline"
              >
                Restaurar
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
