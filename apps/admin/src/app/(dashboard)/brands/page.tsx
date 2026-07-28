'use client';

import type { Brand, BrandStatus } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog, DataTable, Pagination } from '@mijersey/ui';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_LABELS: Record<BrandStatus, string> = {
  ACTIVE: 'Activa',
  ARCHIVED: 'Archivada',
};

export default function BrandsPage() {
  const { accessToken, hasPermission } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const canManage = hasPermission('catalog:manage');

  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BrandStatus | ''>('');

  const [pendingDelete, setPendingDelete] = useState<Brand | null>(null);
  const [productCountError, setProductCountError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const loadBrands = useCallback(async () => {
    if (!accessToken) return;

    try {
      const result = await client.listBrands(accessToken, {
        page,
        pageSize: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setBrands(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar las marcas.');
    }
  }, [client, accessToken, page, search, statusFilter]);

  useEffect(() => {
    void loadBrands();
  }, [loadBrands]);

  async function handleConfirmDelete(force: boolean) {
    if (!accessToken || !pendingDelete) return;
    setIsConfirming(true);
    setProductCountError(null);

    try {
      await client.deleteBrand(accessToken, pendingDelete.id, force);
      setPendingDelete(null);
      await loadBrands();
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'BRAND_HAS_PRODUCTS') {
        setProductCountError(
          'Esta marca tiene productos asociados. Confirma de nuevo para desasociarlos y eliminarla.',
        );
      } else {
        setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar la marca.');
        setPendingDelete(null);
      }
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Marcas</h1>
        {canManage && (
          <Link href="/brands/new">
            <Button>Nueva marca</Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por nombre o slug"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="w-64 rounded-md border border-neutral-200 px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as BrandStatus | '')}
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

      <DataTable<Brand>
        isLoading={!brands}
        rows={brands ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin marcas todavía"
        {...(canManage ? { emptyDescription: 'Crea la primera marca del catálogo.' } : {})}
        columns={[
          { key: 'name', header: 'Nombre', render: (row) => row.name },
          { key: 'slug', header: 'Slug', render: (row) => row.slug },
          { key: 'country', header: 'País', render: (row) => row.country ?? '—' },
          { key: 'status', header: 'Estado', render: (row) => STATUS_LABELS[row.status] },
          {
            key: 'actions',
            header: '',
            render: (row) =>
              canManage ? (
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/brands/${row.id}`}
                    className="text-brand-600 text-sm hover:underline"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="text-danger-600 text-sm hover:underline"
                    onClick={() => {
                      setProductCountError(null);
                      setPendingDelete(row);
                    }}
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
        title="Eliminar marca"
        description={
          productCountError ?? `"${pendingDelete?.name ?? ''}" se eliminará permanentemente.`
        }
        confirmLabel={productCountError ? 'Eliminar de todos modos' : 'Eliminar'}
        isDestructive
        isConfirming={isConfirming}
        onConfirm={() => void handleConfirmDelete(productCountError !== null)}
        onCancel={() => {
          setPendingDelete(null);
          setProductCountError(null);
        }}
      />
    </div>
  );
}
