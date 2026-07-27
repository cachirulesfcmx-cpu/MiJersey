'use client';

import type { Attribute, AttributeStatus, AttributeType } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog, DataTable, Pagination } from '@mijersey/ui';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_LABELS: Record<AttributeStatus, string> = {
  ACTIVE: 'Activo',
  ARCHIVED: 'Archivado',
};

const TYPE_LABELS: Record<AttributeType, string> = {
  TEXT: 'Texto',
  NUMBER: 'Número',
  BOOLEAN: 'Booleano',
  DATE: 'Fecha',
  LIST: 'Lista',
  COLOR: 'Color',
  MEASUREMENT: 'Medida',
};

export default function AttributesPage() {
  const { accessToken, hasPermission } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const canManage = hasPermission('catalog:manage');

  const [attributes, setAttributes] = useState<Attribute[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AttributeStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<AttributeType | ''>('');

  const [pendingDelete, setPendingDelete] = useState<Attribute | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter]);

  const loadAttributes = useCallback(async () => {
    if (!accessToken) return;

    try {
      const result = await client.listAttributes(accessToken, {
        page,
        pageSize: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
      });
      setAttributes(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar los atributos.',
      );
    }
  }, [client, accessToken, page, search, statusFilter, typeFilter]);

  useEffect(() => {
    void loadAttributes();
  }, [loadAttributes]);

  async function handleConfirmDelete() {
    if (!accessToken || !pendingDelete) return;
    setIsConfirming(true);

    try {
      await client.deleteAttribute(accessToken, pendingDelete.id);
      setPendingDelete(null);
      await loadAttributes();
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Atributos</h1>
        {canManage && (
          <Link href="/attributes/new">
            <Button>Nuevo atributo</Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por nombre o código"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="w-64 rounded-md border border-neutral-200 px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as AttributeStatus | '')}
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
          onChange={(event) => setTypeFilter(event.target.value as AttributeType | '')}
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

      <DataTable<Attribute>
        isLoading={!attributes}
        rows={attributes ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin atributos todavía"
        {...(canManage ? { emptyDescription: 'Crea el primer atributo del catálogo.' } : {})}
        columns={[
          { key: 'name', header: 'Nombre', render: (row) => row.name },
          { key: 'code', header: 'Código', render: (row) => row.code },
          { key: 'type', header: 'Tipo', render: (row) => TYPE_LABELS[row.type] },
          {
            key: 'flags',
            header: 'Reglas',
            render: (row) =>
              [
                row.isFilterable ? 'Filtrable' : null,
                row.isComparable ? 'Comparable' : null,
                row.isRequired ? 'Obligatorio' : null,
              ]
                .filter(Boolean)
                .join(', ') || '—',
          },
          { key: 'status', header: 'Estado', render: (row) => STATUS_LABELS[row.status] },
          {
            key: 'actions',
            header: '',
            render: (row) =>
              canManage ? (
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/attributes/${row.id}`}
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
        title="Eliminar atributo"
        description={`"${pendingDelete?.name ?? ''}" dejará de listarse y filtrarse. Las asignaciones existentes en productos no se modifican.`}
        confirmLabel="Eliminar"
        isDestructive
        isConfirming={isConfirming}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
