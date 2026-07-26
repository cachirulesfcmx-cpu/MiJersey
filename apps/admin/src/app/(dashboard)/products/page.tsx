'use client';

import type { Product, ProductStatus, ProductType } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog, DataTable, Pagination } from '@mijersey/ui';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  ARCHIVED: 'Archivado',
};

const TYPE_LABELS: Record<ProductType, string> = {
  PHYSICAL: 'Físico',
  DIGITAL: 'Digital',
};

type PendingDelete = { kind: 'single'; product: Product } | { kind: 'bulk'; ids: string[] };

export default function ProductsPage() {
  const { accessToken, hasPermission } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const canManage = hasPermission('catalog:manage');

  const [products, setProducts] = useState<Product[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ProductType | ''>('');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter]);

  const loadProducts = useCallback(async () => {
    if (!accessToken) return;

    try {
      const result = await client.listProducts(accessToken, {
        page,
        pageSize: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
      });
      setProducts(result.items);
      setTotal(result.total);
      setSelectedIds(new Set());
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar los productos.',
      );
    }
  }, [client, accessToken, page, search, statusFilter, typeFilter]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === (products?.length ?? 0) ? new Set() : new Set(products?.map((p) => p.id)),
    );
  }

  async function handlePublish(product: Product) {
    if (!accessToken) return;
    await client.publishProduct(accessToken, product.id);
    await loadProducts();
  }

  async function handleArchive(product: Product) {
    if (!accessToken) return;
    await client.archiveProduct(accessToken, product.id);
    await loadProducts();
  }

  async function handleDuplicate(product: Product) {
    if (!accessToken) return;
    await client.duplicateProduct(accessToken, product.id);
    await loadProducts();
  }

  async function handleBulkStatus(status: ProductStatus) {
    if (!accessToken || selectedIds.size === 0) return;
    await client.bulkUpdateProductStatus(accessToken, [...selectedIds], status);
    await loadProducts();
  }

  async function handleConfirmDelete() {
    if (!accessToken || !pendingDelete) return;
    setIsConfirming(true);

    try {
      if (pendingDelete.kind === 'single') {
        await client.deleteProduct(accessToken, pendingDelete.product.id);
      } else {
        await client.bulkDeleteProducts(accessToken, pendingDelete.ids);
      }
      setPendingDelete(null);
      await loadProducts();
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Productos</h1>
        {canManage && (
          <Link href="/products/new">
            <Button>Nuevo producto</Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por nombre, SKU o slug"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="w-64 rounded-md border border-neutral-200 px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as ProductStatus | '')}
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
          onChange={(event) => setTypeFilter(event.target.value as ProductType | '')}
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

      {canManage && selectedIds.size > 0 && (
        <div className="bg-brand-50 flex items-center gap-3 rounded-md px-4 py-2 text-sm">
          <span>{selectedIds.size} seleccionados</span>
          <Button variant="secondary" onClick={() => void handleBulkStatus('ACTIVE')}>
            Publicar
          </Button>
          <Button variant="secondary" onClick={() => void handleBulkStatus('ARCHIVED')}>
            Archivar
          </Button>
          <Button
            variant="danger"
            onClick={() => setPendingDelete({ kind: 'bulk', ids: [...selectedIds] })}
          >
            Eliminar
          </Button>
        </div>
      )}

      <DataTable<Product>
        isLoading={!products}
        rows={products ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin productos todavía"
        {...(canManage ? { emptyDescription: 'Crea el primer producto del catálogo.' } : {})}
        columns={[
          ...(canManage
            ? [
                {
                  key: 'select',
                  header: (
                    <input
                      type="checkbox"
                      aria-label="Seleccionar todos"
                      checked={selectedIds.size > 0 && selectedIds.size === (products?.length ?? 0)}
                      onChange={toggleSelectAll}
                    />
                  ),
                  render: (row: Product) => (
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${row.name}`}
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleSelected(row.id)}
                    />
                  ),
                },
              ]
            : []),
          { key: 'name', header: 'Nombre', render: (row) => row.name },
          { key: 'sku', header: 'SKU', render: (row) => row.sku },
          { key: 'status', header: 'Estado', render: (row) => STATUS_LABELS[row.status] },
          { key: 'visibility', header: 'Visibilidad', render: (row) => row.visibility },
          { key: 'type', header: 'Tipo', render: (row) => TYPE_LABELS[row.type] },
          {
            key: 'actions',
            header: '',
            render: (row) =>
              canManage ? (
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/products/${row.id}`}
                    className="text-brand-600 text-sm hover:underline"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    className="text-sm text-neutral-500 hover:underline"
                    onClick={() => void handleDuplicate(row)}
                  >
                    Duplicar
                  </button>
                  {row.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      className="text-sm text-neutral-500 hover:underline"
                      onClick={() => void handleArchive(row)}
                    >
                      Archivar
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-brand-600 text-sm hover:underline"
                      onClick={() => void handlePublish(row)}
                    >
                      Publicar
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-danger-600 text-sm hover:underline"
                    onClick={() => setPendingDelete({ kind: 'single', product: row })}
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
        title="Eliminar producto"
        description={
          pendingDelete?.kind === 'bulk'
            ? `Se eliminarán ${pendingDelete.ids.length} productos. Esta acción no se puede deshacer desde el panel.`
            : `"${pendingDelete?.kind === 'single' ? pendingDelete.product.name : ''}" dejará de listarse en todas partes.`
        }
        confirmLabel="Eliminar"
        isDestructive
        isConfirming={isConfirming}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
