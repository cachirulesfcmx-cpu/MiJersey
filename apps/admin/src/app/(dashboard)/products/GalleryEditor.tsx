'use client';

import type { ApiClient, ProductGalleryItem } from '@mijersey/sdk';
import { ApiClientError } from '@mijersey/sdk';
import { Button } from '@mijersey/ui';
import { useCallback, useEffect, useState } from 'react';

import { MediaPicker } from '../../../components/MediaPicker';

interface GalleryEditorProps {
  productId: string;
  accessToken: string;
  client: ApiClient;
  canManage: boolean;
}

export function GalleryEditor({ productId, accessToken, client, canManage }: GalleryEditorProps) {
  const [items, setItems] = useState<ProductGalleryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const loaded = await client.getProductGallery(accessToken, productId);
      setItems(loaded);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar la galería.');
    }
  }, [client, accessToken, productId]);

  useEffect(() => {
    void load();
  }, [load]);

  function move(index: number, direction: -1 | 1) {
    setItems((prev) => {
      if (!prev) return prev;
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const current = prev[index];
      const swapped = prev[target];
      if (!current || !swapped) return prev;
      const next = [...prev];
      next[index] = swapped;
      next[target] = current;
      return next;
    });
    setSavedMessage(null);
  }

  function remove(index: number) {
    setItems((prev) => (prev ? prev.filter((_, i) => i !== index) : prev));
    setSavedMessage(null);
  }

  async function handleAdd(mediaId: string | null) {
    if (!mediaId || !items) return;
    if (items.some((item) => item.mediaId === mediaId)) return;

    try {
      const asset = await client.getMedia(accessToken, mediaId);
      setItems([
        ...items,
        { mediaId, sortOrder: items.length, url: asset.url, thumbnailUrl: asset.thumbnailUrl },
      ]);
      setSavedMessage(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo agregar la imagen.');
    }
  }

  async function handleSave() {
    if (!items) return;
    setError(null);
    setIsSaving(true);

    try {
      await client.setProductGallery(accessToken, productId, {
        mediaIds: items.map((item) => item.mediaId),
      });
      setSavedMessage('Galería guardada.');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar la galería.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-neutral-900">Galería</h2>

      {error && <p className="text-danger-600 text-sm">{error}</p>}
      {savedMessage && <p className="text-sm text-neutral-500">{savedMessage}</p>}

      {items?.length === 0 && (
        <p className="text-sm text-neutral-500">Sin imágenes todavía en la galería del producto.</p>
      )}

      {items && items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div
              key={item.mediaId}
              className="flex items-center gap-3 rounded-md border border-neutral-200 p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.thumbnailUrl ?? item.url ?? ''}
                alt=""
                className="h-16 w-16 shrink-0 rounded-md border border-neutral-200 object-cover"
              />
              <span className="text-xs text-neutral-400">Posición {index + 1}</span>
              {canManage && (
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="text-xs text-neutral-500 hover:underline disabled:opacity-30"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    Subir
                  </button>
                  <button
                    type="button"
                    className="text-xs text-neutral-500 hover:underline disabled:opacity-30"
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    Bajar
                  </button>
                  <button
                    type="button"
                    className="text-danger-600 text-xs hover:underline"
                    onClick={() => remove(index)}
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {canManage && (
        <div className="flex items-center gap-4 border-t border-neutral-200 pt-3">
          <MediaPicker
            label="Agregar imagen"
            accessToken={accessToken}
            client={client}
            value={null}
            onChange={(id) => void handleAdd(id)}
          />
          <Button isLoading={isSaving} onClick={() => void handleSave()}>
            Guardar galería
          </Button>
        </div>
      )}
    </div>
  );
}
