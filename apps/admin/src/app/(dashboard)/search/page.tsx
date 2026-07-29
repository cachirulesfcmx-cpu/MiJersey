'use client';

import type { SearchAnalytics, SearchSynonym } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog, DataTable, FormField, Input } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

function parseSynonymsInput(text: string): string[] {
  return text
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export default function SearchAdminPage() {
  const { accessToken, hasPermission } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const canManage = hasPermission('catalog:manage');

  const [synonyms, setSynonyms] = useState<SearchSynonym[] | null>(null);
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [term, setTerm] = useState('');
  const [synonymsInput, setSynonymsInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SearchSynonym | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSynonyms = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listSearchSynonyms(accessToken);
      setSynonyms(result.items);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar los sinónimos.',
      );
    }
  }, [client, accessToken]);

  const loadAnalytics = useCallback(async () => {
    if (!accessToken) return;
    try {
      setAnalytics(await client.getSearchAnalytics(accessToken));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar la analítica.');
    }
  }, [client, accessToken]);

  useEffect(() => {
    void loadSynonyms();
    void loadAnalytics();
  }, [loadSynonyms, loadAnalytics]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsCreating(true);
    setError(null);

    try {
      await client.createSearchSynonym(accessToken, {
        term,
        synonyms: parseSynonymsInput(synonymsInput),
      });
      setTerm('');
      setSynonymsInput('');
      await loadSynonyms();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear el grupo.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleConfirmDelete() {
    if (!accessToken || !pendingDelete) return;
    setIsDeleting(true);

    try {
      await client.deleteSearchSynonym(accessToken, pendingDelete.id);
      setPendingDelete(null);
      await loadSynonyms();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar el grupo.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Búsqueda</h1>
        <p className="max-w-2xl text-sm text-neutral-500">
          Grupos de sinónimos: buscar por cualquier término del grupo expande la búsqueda a todos
          los demás (p. ej. &quot;jersey&quot; = &quot;camiseta&quot; = &quot;playera&quot;).
        </p>

        {error && <p className="text-danger-600 text-sm">{error}</p>}

        {canManage && (
          <form
            className="flex flex-wrap items-end gap-3 rounded-md border border-neutral-200 p-4"
            onSubmit={(event) => void handleCreate(event)}
          >
            <FormField label="Término" htmlFor="term">
              <Input
                id="term"
                placeholder="jersey"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                required
              />
            </FormField>
            <FormField label="Sinónimos (separados por coma)" htmlFor="synonyms">
              <Input
                id="synonyms"
                placeholder="camiseta, playera"
                value={synonymsInput}
                onChange={(event) => setSynonymsInput(event.target.value)}
                required
              />
            </FormField>
            <Button type="submit" isLoading={isCreating}>
              Agregar grupo
            </Button>
          </form>
        )}

        <DataTable<SearchSynonym>
          isLoading={!synonyms}
          rows={synonyms ?? []}
          getRowKey={(row) => row.id}
          emptyTitle="Sin sinónimos todavía"
          columns={[
            { key: 'term', header: 'Término', render: (row) => row.term },
            { key: 'synonyms', header: 'Sinónimos', render: (row) => row.synonyms.join(', ') },
            {
              key: 'actions',
              header: '',
              render: (row) =>
                canManage ? (
                  <button
                    type="button"
                    className="text-danger-600 text-sm hover:underline"
                    onClick={() => setPendingDelete(row)}
                  >
                    Eliminar
                  </button>
                ) : null,
            },
          ]}
        />
      </div>

      <hr className="border-neutral-200" />

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Analítica básica (últimos {analytics ? '7/30' : '…'} días)
        </h2>
        <p className="text-sm text-neutral-500">
          Un panel completo con clics y conversiones llega con 032-Analytics.
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-neutral-900">Términos más buscados</h3>
            {analytics?.topTerms.length === 0 && (
              <p className="text-sm text-neutral-500">Sin búsquedas recientes.</p>
            )}
            <ul className="flex flex-col gap-1">
              {analytics?.topTerms.map((item) => (
                <li key={item.term} className="flex justify-between text-sm">
                  <span className="text-neutral-900">{item.term}</span>
                  <span className="text-neutral-400">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-neutral-900">Búsquedas sin resultados</h3>
            {analytics?.zeroResultTerms.length === 0 && (
              <p className="text-sm text-neutral-500">Ninguna búsqueda sin resultados.</p>
            )}
            <ul className="flex flex-col gap-1">
              {analytics?.zeroResultTerms.map((item) => (
                <li key={item.term} className="flex justify-between text-sm">
                  <span className="text-neutral-900">{item.term}</span>
                  <span className="text-neutral-400">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Eliminar grupo de sinónimos"
        description={`"${pendingDelete?.term ?? ''}" dejará de expandir la búsqueda.`}
        confirmLabel="Eliminar"
        isDestructive
        isConfirming={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
