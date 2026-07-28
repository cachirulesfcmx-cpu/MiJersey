'use client';

import type { MediaAsset } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button } from '@mijersey/ui';
import { useEffect, useState } from 'react';

interface MediaPickerProps {
  label: string;
  accessToken: string;
  client: ApiClient;
  value: string | null;
  onChange: (mediaId: string | null) => void;
}

export function MediaPicker({ label, accessToken, client, value, onChange }: MediaPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    client
      .getMedia(accessToken, value)
      .then(setSelected)
      .catch(() => setSelected(null));
  }, [client, accessToken, value]);

  useEffect(() => {
    if (!isOpen) return;
    client
      .listMedia(accessToken, { type: 'IMAGE', pageSize: 24 })
      .then((result) => setItems(result.items))
      .catch((err: unknown) => {
        setError(
          err instanceof ApiClientError ? err.message : 'No se pudieron cargar los archivos.',
        );
      });
  }, [client, accessToken, isOpen]);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-neutral-900">{label}</span>

      {selected ? (
        <div className="flex items-center gap-3">
          <img
            src={selected.thumbnailUrl ?? selected.url}
            alt={selected.altText ?? selected.originalName}
            className="h-16 w-16 rounded-md border border-neutral-200 object-cover"
          />
          <div className="flex flex-col gap-1">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
              Cambiar
            </Button>
            <button
              type="button"
              className="text-danger-600 text-xs hover:underline"
              onClick={() => onChange(null)}
            >
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
          Elegir desde Media Library
        </Button>
      )}

      {isOpen && (
        <div className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3">
          {error && <p className="text-danger-600 text-xs">{error}</p>}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {items.map((asset) => (
              <button
                key={asset.id}
                type="button"
                className="hover:border-brand-400 aspect-square overflow-hidden rounded-md border border-neutral-200"
                onClick={() => {
                  onChange(asset.id);
                  setIsOpen(false);
                }}
              >
                <img
                  src={asset.thumbnailUrl ?? asset.url}
                  alt={asset.altText ?? asset.originalName}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="self-start text-xs text-neutral-500 hover:underline"
            onClick={() => setIsOpen(false)}
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
