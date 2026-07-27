'use client';

import type { ApiClient, ProductOption } from '@mijersey/sdk';
import { ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog, Input } from '@mijersey/ui';
import { useCallback, useEffect, useState } from 'react';

interface OptionsEditorProps {
  productId: string;
  accessToken: string;
  client: ApiClient;
  canManage: boolean;
  onChanged?: () => void;
}

function toValuesText(option: ProductOption): string {
  return option.values.map((value) => value.value).join(', ');
}

function parseValues(text: string): string[] {
  return text
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function OptionsEditor({
  productId,
  accessToken,
  client,
  canManage,
  onChanged,
}: OptionsEditorProps) {
  const [options, setOptions] = useState<ProductOption[] | null>(null);
  const [valuesText, setValuesText] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newValues, setNewValues] = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProductOption | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const load = useCallback(async () => {
    try {
      const loaded = await client.getProductOptions(accessToken, productId);
      setOptions(loaded);
      setValuesText(Object.fromEntries(loaded.map((option) => [option.id, toValuesText(option)])));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar las opciones.');
    }
  }, [client, accessToken, productId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    setError(null);
    setIsSavingNew(true);

    try {
      await client.createProductOption(accessToken, productId, {
        name: newName,
        values: parseValues(newValues),
      });
      setNewName('');
      setNewValues('');
      await load();
      onChanged?.();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear la opción.');
    } finally {
      setIsSavingNew(false);
    }
  }

  async function handleSaveValues(option: ProductOption) {
    setError(null);
    setSavingId(option.id);

    try {
      await client.updateProductOption(accessToken, option.id, {
        values: parseValues(valuesText[option.id] ?? ''),
      });
      await load();
      onChanged?.();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron guardar los valores.');
    } finally {
      setSavingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setIsConfirming(true);

    try {
      await client.deleteProductOption(accessToken, pendingDelete.id);
      setPendingDelete(null);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar la opción.');
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-neutral-900">Opciones</h2>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      {options?.length === 0 && (
        <p className="text-sm text-neutral-500">
          Sin opciones todavía. Un producto sin opciones puede tener una sola variante por defecto.
        </p>
      )}

      {options?.map((option) => (
        <div key={option.id} className="flex items-center gap-2">
          <span className="w-24 shrink-0 text-sm font-medium text-neutral-900">{option.name}</span>
          <Input
            disabled={!canManage}
            value={valuesText[option.id] ?? ''}
            onChange={(event) =>
              setValuesText((prev) => ({ ...prev, [option.id]: event.target.value }))
            }
            placeholder="Valores separados por coma"
            className="flex-1"
          />
          {canManage && (
            <>
              <Button
                variant="secondary"
                isLoading={savingId === option.id}
                onClick={() => void handleSaveValues(option)}
              >
                Guardar
              </Button>
              <Button variant="danger" onClick={() => setPendingDelete(option)}>
                Eliminar
              </Button>
            </>
          )}
        </div>
      ))}

      {canManage && (
        <div className="flex items-center gap-2 border-t border-neutral-200 pt-3">
          <Input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Nombre (p. ej. Talla)"
            className="w-24 shrink-0"
          />
          <Input
            value={newValues}
            onChange={(event) => setNewValues(event.target.value)}
            placeholder="Valores separados por coma (p. ej. S, M, L)"
            className="flex-1"
          />
          <Button
            isLoading={isSavingNew}
            disabled={!newName.trim() || !newValues.trim()}
            onClick={() => void handleCreate()}
          >
            Agregar opción
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Eliminar opción"
        description={`"${pendingDelete?.name ?? ''}" se eliminará. Si el producto tiene variantes, elimínalas primero.`}
        confirmLabel="Eliminar"
        isDestructive
        isConfirming={isConfirming}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
