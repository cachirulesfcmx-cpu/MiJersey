'use client';

import type { ApiClient, Attribute } from '@mijersey/sdk';
import { ApiClientError } from '@mijersey/sdk';
import { Button } from '@mijersey/ui';
import { useCallback, useEffect, useState } from 'react';

interface AttributesEditorProps {
  productId: string;
  accessToken: string;
  client: ApiClient;
  canManage: boolean;
}

interface DraftRow {
  attributeId: string;
  valueId: string | null;
  customValue: string | null;
}

const VALUE_BASED_TYPES = new Set(['LIST', 'COLOR']);

export function AttributesEditor({
  productId,
  accessToken,
  client,
  canManage,
}: AttributesEditorProps) {
  const [catalog, setCatalog] = useState<Attribute[]>([]);
  const [draft, setDraft] = useState<DraftRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newAttributeId, setNewAttributeId] = useState('');

  const load = useCallback(async () => {
    try {
      const [assignments, attributesResult] = await Promise.all([
        client.getProductAttributes(accessToken, productId),
        client.listAttributes(accessToken, { status: 'ACTIVE', pageSize: 100 }),
      ]);
      setCatalog(attributesResult.items);
      setDraft(
        assignments.map((assignment) => ({
          attributeId: assignment.attributeId,
          valueId: assignment.valueId,
          customValue: assignment.customValue,
        })),
      );
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar los atributos.',
      );
    }
  }, [client, accessToken, productId]);

  useEffect(() => {
    void load();
  }, [load]);

  function findAttribute(attributeId: string): Attribute | undefined {
    return catalog.find((attribute) => attribute.id === attributeId);
  }

  function updateRow(attributeId: string, patch: Partial<DraftRow>) {
    setDraft(
      (prev) =>
        prev?.map((row) => (row.attributeId === attributeId ? { ...row, ...patch } : row)) ?? prev,
    );
  }

  function removeRow(attributeId: string) {
    setDraft((prev) => prev?.filter((row) => row.attributeId !== attributeId) ?? prev);
  }

  function addRow() {
    if (!newAttributeId || draft?.some((row) => row.attributeId === newAttributeId)) return;
    const attribute = findAttribute(newAttributeId);
    if (!attribute) return;

    const isValueBased = VALUE_BASED_TYPES.has(attribute.type);
    setDraft((prev) => [
      ...(prev ?? []),
      {
        attributeId: newAttributeId,
        valueId: isValueBased ? (attribute.values[0]?.id ?? null) : null,
        customValue: isValueBased ? null : '',
      },
    ]);
    setNewAttributeId('');
  }

  async function handleSave() {
    if (!draft) return;
    setError(null);
    setSavedMessage(null);
    setIsSaving(true);

    try {
      await client.bulkAssignProductAttributes(accessToken, productId, {
        items: draft.map((row) => ({
          attributeId: row.attributeId,
          ...(row.valueId ? { valueId: row.valueId } : {}),
          ...(row.customValue ? { customValue: row.customValue } : {}),
        })),
      });
      setSavedMessage('Atributos guardados.');
      await load();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron guardar los atributos.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  const assignableAttributes = catalog.filter(
    (attribute) => !draft?.some((row) => row.attributeId === attribute.id),
  );

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-neutral-900">Atributos</h2>

      {error && <p className="text-danger-600 text-sm">{error}</p>}
      {savedMessage && <p className="text-sm text-neutral-500">{savedMessage}</p>}

      {draft?.length === 0 && (
        <p className="text-sm text-neutral-500">Sin atributos asignados todavía.</p>
      )}

      {draft?.map((row) => {
        const attribute = findAttribute(row.attributeId);
        const isValueBased = attribute ? VALUE_BASED_TYPES.has(attribute.type) : false;

        return (
          <div key={row.attributeId} className="flex items-center gap-2">
            <span className="w-40 shrink-0 text-sm font-medium text-neutral-900">
              {attribute?.name ?? row.attributeId}
              {attribute?.isRequired && <span className="text-danger-500"> *</span>}
            </span>

            {attribute && isValueBased ? (
              <select
                disabled={!canManage}
                value={row.valueId ?? ''}
                onChange={(event) => updateRow(row.attributeId, { valueId: event.target.value })}
                className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm"
              >
                {attribute.values.map((value) => (
                  <option key={value.id} value={value.id}>
                    {value.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                disabled={!canManage}
                value={row.customValue ?? ''}
                onChange={(event) =>
                  updateRow(row.attributeId, { customValue: event.target.value })
                }
                className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm"
                placeholder={attribute ? undefined : 'Atributo archivado'}
              />
            )}

            {canManage && (
              <button
                type="button"
                onClick={() => removeRow(row.attributeId)}
                className="text-danger-600 text-sm hover:underline"
              >
                Quitar
              </button>
            )}
          </div>
        );
      })}

      {canManage && (
        <div className="flex items-center gap-2 border-t border-neutral-200 pt-3">
          <select
            value={newAttributeId}
            onChange={(event) => setNewAttributeId(event.target.value)}
            className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm"
          >
            <option value="">Selecciona un atributo…</option>
            {assignableAttributes.map((attribute) => (
              <option key={attribute.id} value={attribute.id}>
                {attribute.name}
              </option>
            ))}
          </select>
          <Button variant="secondary" disabled={!newAttributeId} onClick={addRow}>
            Agregar
          </Button>
        </div>
      )}

      {canManage && (
        <div className="flex justify-end">
          <Button isLoading={isSaving} onClick={() => void handleSave()}>
            Guardar cambios
          </Button>
        </div>
      )}
    </div>
  );
}
