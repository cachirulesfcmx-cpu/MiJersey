'use client';

import type {
  ConsentCategory,
  CreateTrackingProviderInput,
  TrackingProvider,
  TrackingProviderStatus,
  TrackingProviderType,
} from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog, DataTable, FormField } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PROVIDER_LABELS: Record<TrackingProviderType, string> = {
  GOOGLE_ANALYTICS_4: 'Google Analytics 4',
  GOOGLE_TAG_MANAGER: 'Google Tag Manager',
  META_PIXEL: 'Meta Pixel',
  TIKTOK_PIXEL: 'TikTok Pixel',
  CONVERSION_API: 'Conversion API',
};

const PROVIDER_TYPES = Object.keys(PROVIDER_LABELS) as TrackingProviderType[];
const CONSENT_CATEGORIES: ConsentCategory[] = ['necessary', 'analytics', 'marketing'];

/** Campos de configuración por tipo de proveedor (033 §3/§9) — solo `CONVERSION_API.accessToken` es un secreto server-side; el resto son IDs seguros de exponer en el navegador. */
const CONFIG_FIELDS: Record<
  TrackingProviderType,
  Array<{ key: string; label: string; secret?: boolean }>
> = {
  GOOGLE_ANALYTICS_4: [{ key: 'measurementId', label: 'Measurement ID (G-XXXXXXX)' }],
  GOOGLE_TAG_MANAGER: [{ key: 'containerId', label: 'Container ID (GTM-XXXXXXX)' }],
  META_PIXEL: [{ key: 'pixelId', label: 'Pixel ID' }],
  TIKTOK_PIXEL: [{ key: 'pixelId', label: 'Pixel ID' }],
  CONVERSION_API: [
    { key: 'pixelId', label: 'Pixel ID' },
    { key: 'accessToken', label: 'Access Token', secret: true },
  ],
};

interface FormState {
  provider: TrackingProviderType;
  status: TrackingProviderStatus;
  consentCategory: ConsentCategory | '';
  configuration: Record<string, string>;
}

function emptyForm(): FormState {
  return {
    provider: 'GOOGLE_ANALYTICS_4',
    status: 'INACTIVE',
    consentCategory: '',
    configuration: {},
  };
}

/** Provider Manager (033 §6) — un único formulario sirve para crear y editar (`editingId` distingue el modo); los campos de configuración cambian según el tipo de proveedor seleccionado en vez de un textarea JSON genérico, porque el conjunto de campos por tipo es pequeño y cerrado (§3). */
export default function TrackingProvidersPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [providers, setProviders] = useState<TrackingProvider[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TrackingProvider | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listTrackingProviders(accessToken);
      setProviders(result);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar los proveedores.',
      );
    }
  }, [client, accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(provider: TrackingProvider) {
    setEditingId(provider.id);
    setForm({
      provider: provider.provider,
      status: provider.status,
      consentCategory: (provider.consentCategory as ConsentCategory | null) ?? '',
      configuration: Object.fromEntries(
        Object.entries(provider.configuration).map(([key, value]) => [key, String(value)]),
      ),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
  }

  async function handleSave() {
    if (!accessToken) return;
    setIsSaving(true);
    setError(null);
    try {
      const configuration = form.configuration;
      if (editingId) {
        await client.updateTrackingProvider(accessToken, editingId, {
          status: form.status,
          configuration,
          consentCategory: form.consentCategory || null,
        });
      } else {
        const input: CreateTrackingProviderInput = {
          provider: form.provider,
          status: form.status,
          configuration,
          ...(form.consentCategory ? { consentCategory: form.consentCategory } : {}),
        };
        await client.createTrackingProvider(accessToken, input);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar el proveedor.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!accessToken || !pendingDelete) return;
    setIsDeleting(true);
    try {
      await client.deleteTrackingProvider(accessToken, pendingDelete.id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar el proveedor.');
    } finally {
      setIsDeleting(false);
    }
  }

  const fields = CONFIG_FIELDS[form.provider];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Proveedores de tracking</h1>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <section className="flex flex-col gap-4 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-lg font-medium text-neutral-900">
          {editingId ? 'Editar proveedor' : 'Nuevo proveedor'}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="Proveedor" htmlFor="provider-type">
            <select
              id="provider-type"
              value={form.provider}
              disabled={editingId !== null}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  provider: e.target.value as TrackingProviderType,
                  configuration: {},
                }))
              }
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-50"
            >
              {PROVIDER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PROVIDER_LABELS[type]}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Estado" htmlFor="provider-status">
            <select
              id="provider-status"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as TrackingProviderStatus }))
              }
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="INACTIVE">Inactivo</option>
              <option value="ACTIVE">Activo</option>
            </select>
          </FormField>

          <FormField label="Categoría de consentimiento" htmlFor="provider-consent">
            <select
              id="provider-consent"
              value={form.consentCategory}
              onChange={(e) =>
                setForm((f) => ({ ...f, consentCategory: e.target.value as ConsentCategory | '' }))
              }
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
            >
              <option value="">Sin consentimiento (ej. server-side)</option>
              {CONSENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <FormField key={field.key} label={field.label} htmlFor={`config-${field.key}`}>
              <input
                id={`config-${field.key}`}
                type={field.secret ? 'password' : 'text'}
                value={form.configuration[field.key] ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    configuration: { ...f.configuration, [field.key]: e.target.value },
                  }))
                }
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
              />
            </FormField>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={() => void handleSave()} isLoading={isSaving}>
            {editingId ? 'Guardar cambios' : 'Crear proveedor'}
          </Button>
          {editingId && (
            <Button variant="ghost" onClick={resetForm}>
              Cancelar
            </Button>
          )}
        </div>
      </section>

      <DataTable<TrackingProvider>
        isLoading={!providers}
        rows={providers ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin proveedores configurados"
        columns={[
          { key: 'provider', header: 'Proveedor', render: (row) => PROVIDER_LABELS[row.provider] },
          {
            key: 'status',
            header: 'Estado',
            render: (row) => (row.status === 'ACTIVE' ? 'Activo' : 'Inactivo'),
          },
          {
            key: 'consentCategory',
            header: 'Consentimiento',
            render: (row) => row.consentCategory ?? '—',
          },
          {
            key: 'updatedAt',
            header: 'Actualizado',
            render: (row) => new Date(row.updatedAt).toLocaleString('es-MX'),
          },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => startEdit(row)}>
                  Editar
                </Button>
                <Button variant="danger" onClick={() => setPendingDelete(row)}>
                  Eliminar
                </Button>
              </div>
            ),
          },
        ]}
      />

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={`¿Eliminar "${pendingDelete ? PROVIDER_LABELS[pendingDelete.provider] : ''}"?`}
        description="Esta acción no se puede deshacer."
        isDestructive
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
