'use client';

import type { HomeSection, HomeSectionType } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { HomeSectionConfigForm } from '../../../components/HomeSectionConfigForm';
import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const TYPE_LABELS: Record<HomeSectionType, string> = {
  HERO_BANNER: 'Hero Banner',
  BANNER_GRID: 'Banner Grid',
  FEATURED_PRODUCTS: 'Productos destacados',
  FEATURED_CATEGORIES: 'Categorías destacadas',
  FEATURED_COLLECTIONS: 'Colecciones destacadas',
  FEATURED_BRANDS: 'Marcas destacadas',
  PROMOTION_BANNER: 'Banner de promoción',
  RICH_TEXT: 'Texto enriquecido',
  IMAGE_TEXT: 'Imagen + texto',
  VIDEO_BANNER: 'Banner de video',
  NEWSLETTER: 'Newsletter',
};

const DEFAULT_CONFIG_BY_TYPE: Record<HomeSectionType, Record<string, unknown>> = {
  HERO_BANNER: { imageMediaId: null, headline: '' },
  BANNER_GRID: { banners: [] },
  FEATURED_PRODUCTS: { heading: '', productIds: [] },
  FEATURED_CATEGORIES: { heading: '', categoryIds: [] },
  FEATURED_COLLECTIONS: { heading: '', collectionIds: [] },
  FEATURED_BRANDS: { heading: '', brandIds: [] },
  PROMOTION_BANNER: { imageMediaId: null },
  RICH_TEXT: { html: '' },
  IMAGE_TEXT: { imageMediaId: null },
  VIDEO_BANNER: { videoUrl: '' },
  NEWSLETTER: {},
};

export default function HomeSectionsPage() {
  const { accessToken, hasPermission } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const canManage = hasPermission('catalog:manage');

  const [sections, setSections] = useState<HomeSection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftConfig, setDraftConfig] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<HomeSection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [newType, setNewType] = useState<HomeSectionType>('HERO_BANNER');
  const [newTitle, setNewTitle] = useState('');

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listHomeSections(accessToken);
      setSections(result.items);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar las secciones.',
      );
    }
  }, [client, accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(section: HomeSection) {
    setExpandedId(section.id);
    setDraftTitle(section.title);
    setDraftConfig(section.configuration);
  }

  async function handleSave(section: HomeSection) {
    if (!accessToken) return;
    setIsSaving(true);
    setError(null);
    try {
      await client.updateHomeSection(accessToken, section.id, {
        title: draftTitle,
        configuration: draftConfig,
      });
      setExpandedId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar la sección.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(section: HomeSection) {
    if (!accessToken) return;
    try {
      await client.updateHomeSection(accessToken, section.id, {
        status: section.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED',
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cambiar el estado.');
    }
  }

  async function handleToggleVisibility(section: HomeSection) {
    if (!accessToken) return;
    try {
      await client.updateHomeSection(accessToken, section.id, { isVisible: !section.isVisible });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cambiar la visibilidad.');
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!accessToken || !sections) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const orderedIds = sections.map((s) => s.id);
    const swap = orderedIds[index]!;
    orderedIds[index] = orderedIds[newIndex]!;
    orderedIds[newIndex] = swap;

    try {
      await client.reorderHomeSections(accessToken, orderedIds);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo reordenar.');
    }
  }

  async function handleCreate() {
    if (!accessToken) return;
    setIsSaving(true);
    setError(null);
    try {
      await client.createHomeSection(accessToken, {
        type: newType,
        title: newTitle || TYPE_LABELS[newType],
        configuration: DEFAULT_CONFIG_BY_TYPE[newType],
        status: 'DRAFT',
        isVisible: true,
      });
      setIsCreating(false);
      setNewTitle('');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear la sección.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!accessToken || !pendingDelete) return;
    setIsDeleting(true);
    try {
      await client.deleteHomeSection(accessToken, pendingDelete.id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar la sección.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Home</h1>
          <p className="text-sm text-neutral-500">
            Bloques de la página de inicio — reordénalos, actívalos o desactívalos sin tocar código.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setIsCreating((v) => !v)}>
            {isCreating ? 'Cancelar' : '+ Agregar sección'}
          </Button>
        )}
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      {isCreating && (
        <div className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
          <select
            className="w-full max-w-sm rounded-md border border-neutral-200 px-3 py-2 text-sm"
            value={newType}
            onChange={(e) => setNewType(e.target.value as HomeSectionType)}
          >
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            className="w-full max-w-sm rounded-md border border-neutral-200 px-3 py-2 text-sm"
            placeholder="Título administrativo (opcional)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Button onClick={() => void handleCreate()} isLoading={isSaving}>
            Crear sección
          </Button>
        </div>
      )}

      {!sections ? (
        <p className="text-neutral-400">Cargando…</p>
      ) : sections.length === 0 ? (
        <p className="text-neutral-400">Todavía no hay secciones configuradas.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sections.map((section, index) => (
            <div key={section.id} className="rounded-md border border-neutral-200">
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => void handleMove(index, -1)}
                      className="text-xs text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                      aria-label="Subir"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={index === sections.length - 1}
                      onClick={() => void handleMove(index, 1)}
                      className="text-xs text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                      aria-label="Bajar"
                    >
                      ▼
                    </button>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{section.title}</p>
                    <p className="text-xs text-neutral-500">{TYPE_LABELS[section.type]}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => void handleToggleStatus(section)}
                    disabled={!canManage}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      section.status === 'PUBLISHED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {section.status === 'PUBLISHED' ? 'Publicada' : 'Borrador'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggleVisibility(section)}
                    disabled={!canManage}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      section.isVisible
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {section.isVisible ? 'Visible' : 'Oculta'}
                  </button>
                  {canManage && (
                    <>
                      <button
                        type="button"
                        className="text-sm text-neutral-500 hover:underline"
                        onClick={() =>
                          expandedId === section.id ? setExpandedId(null) : startEdit(section)
                        }
                      >
                        {expandedId === section.id ? 'Cerrar' : 'Editar'}
                      </button>
                      <button
                        type="button"
                        className="text-danger-600 text-sm hover:underline"
                        onClick={() => setPendingDelete(section)}
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {expandedId === section.id && (
                <div className="flex flex-col gap-4 border-t border-neutral-200 p-4">
                  <input
                    className="w-full max-w-sm rounded-md border border-neutral-200 px-3 py-2 text-sm"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                  />
                  {accessToken && (
                    <HomeSectionConfigForm
                      type={section.type}
                      configuration={draftConfig}
                      onChange={setDraftConfig}
                      accessToken={accessToken}
                      client={client}
                    />
                  )}
                  <div className="flex gap-2">
                    <Button onClick={() => void handleSave(section)} isLoading={isSaving}>
                      Guardar
                    </Button>
                    <Button variant="secondary" onClick={() => setExpandedId(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Eliminar sección"
        description={`"${pendingDelete?.title ?? ''}" dejará de mostrarse en la Home.`}
        confirmLabel="Eliminar"
        isDestructive
        isConfirming={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
