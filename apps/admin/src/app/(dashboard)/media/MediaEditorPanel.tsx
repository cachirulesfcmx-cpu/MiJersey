'use client';

import type { Folder, MediaAsset, MediaAssetStatus, UpdateMediaInput } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useEffect, useState } from 'react';

interface MediaEditorPanelProps {
  asset: MediaAsset;
  folders: Folder[];
  canManage: boolean;
  isSaving: boolean;
  onSave: (updates: UpdateMediaInput) => Promise<void>;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export function MediaEditorPanel({
  asset,
  folders,
  canManage,
  isSaving,
  onSave,
  onClose,
}: MediaEditorPanelProps) {
  const [title, setTitle] = useState(asset.title ?? '');
  const [altText, setAltText] = useState(asset.altText ?? '');
  const [folderId, setFolderId] = useState(asset.folderId ?? '');
  const [status, setStatus] = useState<MediaAssetStatus>(asset.status);
  const [tags, setTags] = useState(asset.tags.map((tag) => tag.name).join(', '));

  useEffect(() => {
    setTitle(asset.title ?? '');
    setAltText(asset.altText ?? '');
    setFolderId(asset.folderId ?? '');
    setStatus(asset.status);
    setTags(asset.tags.map((tag) => tag.name).join(', '));
  }, [asset]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await onSave({
      title: title.trim() || null,
      altText: altText.trim() || null,
      folderId: folderId || null,
      status,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  }

  return (
    <aside className="flex w-80 flex-shrink-0 flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">Detalles del archivo</h2>
        <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-900">
          ×
        </button>
      </div>

      {asset.type === 'IMAGE' ? (
        <img
          src={asset.thumbnailUrl ?? asset.url}
          alt={asset.altText ?? asset.originalName}
          className="h-40 w-full rounded-md border border-neutral-100 object-contain"
        />
      ) : (
        <div className="flex h-40 w-full items-center justify-center rounded-md border border-neutral-100 bg-neutral-50 text-sm text-neutral-400">
          {asset.type}
        </div>
      )}

      <dl className="grid grid-cols-2 gap-1 text-xs text-neutral-500">
        <dt>Nombre original</dt>
        <dd className="truncate text-right text-neutral-700">{asset.originalName}</dd>
        <dt>Tipo</dt>
        <dd className="text-right text-neutral-700">{asset.mimeType}</dd>
        <dt>Tamaño</dt>
        <dd className="text-right text-neutral-700">{formatBytes(asset.size)}</dd>
        {asset.width && asset.height && (
          <>
            <dt>Dimensiones</dt>
            <dd className="text-right text-neutral-700">
              {asset.width}×{asset.height}
            </dd>
          </>
        )}
      </dl>

      <form className="flex flex-col gap-3" onSubmit={(event) => void handleSubmit(event)}>
        <FormField label="Título">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={!canManage}
          />
        </FormField>
        <FormField label="Texto alternativo" hint="Usado para accesibilidad y SEO.">
          <Input
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            disabled={!canManage}
          />
        </FormField>
        <FormField label="Carpeta">
          <select
            value={folderId}
            onChange={(event) => setFolderId(event.target.value)}
            disabled={!canManage}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-50"
          >
            <option value="">Sin carpeta</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Etiquetas" hint="Separadas por comas.">
          <Input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            disabled={!canManage}
          />
        </FormField>
        <FormField label="Estado">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as MediaAssetStatus)}
            disabled={!canManage}
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-50"
          >
            <option value="ACTIVE">Activo</option>
            <option value="ARCHIVED">Archivado</option>
          </select>
        </FormField>

        {canManage && (
          <Button type="submit" isLoading={isSaving}>
            Guardar cambios
          </Button>
        )}
      </form>
    </aside>
  );
}
