'use client';

import type { Collection, CollectionStatus, CollectionType } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog, DataTable, Pagination } from '@mijersey/ui';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_LABELS: Record<CollectionStatus, string> = { ACTIVE: 'Activa', HIDDEN: 'Oculta' };
const TYPE_LABELS: Record<CollectionType, string> = { MANUAL: 'Manual', SMART: 'Inteligente' };

export default function CollectionsPage() {
  const { accessToken, hasPermission } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const canManage = hasPermission('catalog:manage');

  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CollectionStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<CollectionType | ''>('');

  const [pendingDelete, setPendingDelete] = useState<Collection | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter]);

  const loadCollections = useCallback(async () => {
    if (!accessToken) return;

    try {
      const result = await client.listCollections(accessToken, {
        page,
        pageSize: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
      });
      setCollections(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar las colecciones.',
      );
    }
  }, [client, accessToken, page, search, statusFilter, typeFilter]);

  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  async function handleConfirmDelete() {
    if (!accessToken || !pendingDelete) return;
    setIsConfirming(true);

    try {
      await client.deleteCollection(accessToken, pendingDelete.id);
      setPendingDelete(null);
      await loadCollections();
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Colecciones</h1>
        {canManage && (
          <Link href="/collections/new">
            <Button>Nueva colección</Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por nombre"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="w-64 rounded-md border border-neutral-200 px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as CollectionStatus | '')}
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as CollectionType | '')}
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <DataTable<Collection>
        isLoading={!collections}
        rows={collections ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin colecciones todavía"
        {...(canManage ? { emptyDescription: 'Crea la primera colección del catálogo.' } : {})}
        columns={[
          { key: 'name', header: 'Nombre', render: (row) => row.name },
          { key: 'slug', header: 'Slug', render: (row) => row.slug },
          { key: 'type', header: 'Tipo', render: (row) => TYPE_LABELS[row.type] },
          { key: 'status', header: 'Estado', render: (row) => STATUS_LABELS[row.status] },
          {
            key: 'actions',
            header: '',
            render: (row) =>
              canManage ? (
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/collections/${row.id}`}
                    className="text-brand-600 text-sm hover:underline"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="text-danger-600 text-sm hover:underline"
                    onClick={() => setPendingDelete(row)}
                  >
                    Eliminar
                  </button>
                </div>
              ) : null,
          },
        ]}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Eliminar colección"
        description={`"${pendingDelete?.name ?? ''}" se eliminará junto con sus reglas o su lista de productos.`}
        confirmLabel="Eliminar"
        isDestructive
        isConfirming={isConfirming}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
