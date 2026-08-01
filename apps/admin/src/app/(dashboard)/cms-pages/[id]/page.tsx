'use client';

import type { Page, PageBlockInput, PageVersion } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';

const BLOCK_TYPES = ['RICH_TEXT', 'IMAGE', 'HTML', 'HERO', 'CTA', 'SPACER'];

interface BlockRow {
  type: string;
  position: number;
  configText: string;
}

function toBlockRows(page: Page): BlockRow[] {
  return page.blocks
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((block) => ({
      type: block.type,
      position: block.position,
      configText: JSON.stringify(block.config, null, 2),
    }));
}

/** Page Editor (spec 026 §6): título/slug/plantilla/SEO, editor de bloques (tipo + posición + configuración JSON), Version History con restaurar, y publicación inmediata o programada. */
export default function EditCmsPagePage({ params }: { params: { id: string } }) {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [page, setPage] = useState<Page | null>(null);
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [template, setTemplate] = useState('default');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [publishAt, setPublishAt] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [pageResult, versionsResult] = await Promise.all([
        client.getPage(accessToken, params.id),
        client.listPageVersions(accessToken, params.id, { pageSize: 50 }),
      ]);
      setPage(pageResult);
      setVersions(versionsResult.items);
      setTitle(pageResult.title);
      setSlug(pageResult.slug);
      setTemplate(pageResult.template);
      setSeoTitle(pageResult.seoTitle ?? '');
      setSeoDescription(pageResult.seoDescription ?? '');
      setBlocks(toBlockRows(pageResult));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar la página.');
    }
  }, [client, accessToken, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  function addBlock() {
    setBlocks((prev) => [...prev, { type: 'RICH_TEXT', position: prev.length, configText: '{}' }]);
  }

  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  function updateBlock(index: number, patch: Partial<BlockRow>) {
    setBlocks((prev) => prev.map((block, i) => (i === index ? { ...block, ...patch } : block)));
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const parsedBlocks: PageBlockInput[] = blocks.map((block, index) => ({
        type: block.type,
        position: index,
        config: JSON.parse(block.configText || '{}') as Record<string, unknown>,
      }));
      await client.updatePage(accessToken, params.id, {
        title,
        slug,
        template,
        ...(seoTitle ? { seoTitle } : {}),
        ...(seoDescription ? { seoDescription } : {}),
        blocks: parsedBlocks,
      });
      setSuccessMessage('Cambios guardados.');
      await load();
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? 'Uno de los bloques tiene una configuración JSON inválida.'
          : err instanceof ApiClientError
            ? err.message
            : 'No se pudo guardar la página.',
      );
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
      await client.publishPage(
        accessToken,
        params.id,
        publishAt ? { publishAt: new Date(publishAt).toISOString() } : {},
      );
      setSuccessMessage(publishAt ? 'Publicación programada.' : 'Página publicada.');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo publicar la página.');
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleRestore(versionNumber: number) {
    if (!accessToken) return;
    setError(null);
    setSuccessMessage(null);
    try {
      await client.restorePageVersion(accessToken, params.id, versionNumber);
      setSuccessMessage(`Versión ${versionNumber} restaurada.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo restaurar la versión.');
    }
  }

  if (!page) return <p className="text-sm text-neutral-500">Cargando…</p>;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{page.title}</h1>
        <p className="text-sm text-neutral-500">
          Estado: {page.status}
          {page.publishedAt && ` · ${new Date(page.publishedAt).toLocaleString('es-MX')}`}
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
          <FormField label="Plantilla" htmlFor="edit-template">
            <Input
              id="edit-template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            />
          </FormField>
        </div>

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

        <div className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Bloques</h2>
            <Button type="button" variant="secondary" onClick={addBlock}>
              + Agregar bloque
            </Button>
          </div>

          {blocks.length === 0 && <p className="text-sm text-neutral-500">Sin bloques todavía.</p>}

          {blocks.map((block, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3"
            >
              <div className="flex items-center gap-3">
                <select
                  value={block.type}
                  onChange={(e) => updateBlock(index, { type: e.target.value })}
                  className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
                >
                  {BLOCK_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-neutral-500">Posición {index}</span>
                <button
                  type="button"
                  onClick={() => removeBlock(index)}
                  className="text-danger-600 ml-auto text-xs hover:underline"
                >
                  Quitar
                </button>
              </div>
              <textarea
                value={block.configText}
                onChange={(e) => updateBlock(index, { configText: e.target.value })}
                rows={4}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-xs"
              />
            </div>
          ))}
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
