'use client';

import type { Warehouse, WarehouseStatus } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, DataTable, Pagination } from '@mijersey/ui';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_LABELS: Record<WarehouseStatus, string> = {
  ACTIVE: 'Activo',
  ARCHIVED: 'Archivado',
};

export default function WarehousesPage() {
  const { accessToken, hasPermission } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const canManage = hasPermission('catalog:manage');

  const [warehouses, setWarehouses] = useState<Warehouse[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WarehouseStatus | ''>('');

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const loadWarehouses = useCallback(async () => {
    if (!accessToken) return;

    try {
      const result = await client.listWarehouses(accessToken, {
        page,
        pageSize: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setWarehouses(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar los almacenes.',
      );
    }
  }, [client, accessToken, page, search, statusFilter]);

  useEffect(() => {
    void loadWarehouses();
  }, [loadWarehouses]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Almacenes</h1>
        {canManage && (
          <Link href="/warehouses/new">
            <Button>Nuevo almacén</Button>
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
          onChange={(event) => setStatusFilter(event.target.value as WarehouseStatus | '')}
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <DataTable<Warehouse>
        isLoading={!warehouses}
        rows={warehouses ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin almacenes todavía"
        {...(canManage ? { emptyDescription: 'Crea el primer almacén.' } : {})}
        columns={[
          { key: 'name', header: 'Nombre', render: (row) => row.name },
          { key: 'code', header: 'Código', render: (row) => row.code },
          { key: 'status', header: 'Estado', render: (row) => STATUS_LABELS[row.status] },
          {
            key: 'actions',
            header: '',
            render: (row) =>
              canManage ? (
                <div className="flex justify-end">
                  <Link
                    href={`/warehouses/${row.id}`}
                    className="text-brand-600 text-sm hover:underline"
                  >
                    Editar
                  </Link>
                </div>
              ) : null,
          },
        ]}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
