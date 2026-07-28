'use client';

import type { Redirect } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog, DataTable, FormField, Input, Pagination } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 20;

export default function RedirectsPage() {
  const { accessToken, hasPermission } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const canManage = hasPermission('catalog:manage');

  const [redirects, setRedirects] = useState<Redirect[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [fromPath, setFromPath] = useState('');
  const [toPath, setToPath] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Redirect | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRedirects = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listRedirects(accessToken, { page, pageSize: PAGE_SIZE });
      setRedirects(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar las redirecciones.',
      );
    }
  }, [client, accessToken, page]);

  useEffect(() => {
    void loadRedirects();
  }, [loadRedirects]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsCreating(true);
    setError(null);

    try {
      await client.createRedirect(accessToken, { fromPath, toPath });
      setFromPath('');
      setToPath('');
      await loadRedirects();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear la redirección.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleConfirmDelete() {
    if (!accessToken || !pendingDelete) return;
    setIsDeleting(true);

    try {
      await client.deleteRedirect(accessToken, pendingDelete.id);
      setPendingDelete(null);
      await loadRedirects();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar la redirección.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Redirecciones</h1>
      <p className="max-w-2xl text-sm text-neutral-500">
        Se crean automáticamente cuando cambia el slug de un producto, categoría, colección o marca.
        También puedes crear redirecciones manuales aquí.
      </p>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      {canManage && (
        <form
          className="flex flex-wrap items-end gap-3 rounded-md border border-neutral-200 p-4"
          onSubmit={(event) => void handleCreate(event)}
        >
          <FormField label="Ruta de origen" htmlFor="fromPath">
            <Input
              id="fromPath"
              placeholder="/productos-viejo"
              value={fromPath}
              onChange={(event) => setFromPath(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Ruta de destino" htmlFor="toPath">
            <Input
              id="toPath"
              placeholder="/products/nuevo-slug"
              value={toPath}
              onChange={(event) => setToPath(event.target.value)}
              required
            />
          </FormField>
          <Button type="submit" isLoading={isCreating}>
            Crear redirección
          </Button>
        </form>
      )}

      <DataTable<Redirect>
        isLoading={!redirects}
        rows={redirects ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin redirecciones todavía"
        columns={[
          { key: 'fromPath', header: 'Origen', render: (row) => row.fromPath },
          { key: 'toPath', header: 'Destino', render: (row) => row.toPath },
          { key: 'statusCode', header: 'Código', render: (row) => row.statusCode },
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

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Eliminar redirección"
        description={`"${pendingDelete?.fromPath ?? ''}" dejará de redirigir.`}
        confirmLabel="Eliminar"
        isDestructive
        isConfirming={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
