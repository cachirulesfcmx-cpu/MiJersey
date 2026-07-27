'use client';

import type { InventoryListItem, Warehouse } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { DataTable, Input, Pagination } from '@mijersey/ui';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';
import { AdjustInventoryForm } from './AdjustInventoryForm';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export default function InventoryPage() {
  const { accessToken, hasPermission } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const canManage = hasPermission('catalog:manage');

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [allWarehouses, setAllWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<InventoryListItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [belowSafetyStock, setBelowSafetyStock] = useState(false);

  const [safetyDrafts, setSafetyDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, warehouseFilter, belowSafetyStock]);

  useEffect(() => {
    if (!accessToken) return;
    client
      .listWarehouses(accessToken, { status: 'ACTIVE', pageSize: 100 })
      .then((result) => setWarehouses(result.items))
      .catch(() => setWarehouses([]));
    // Los almacenes archivados pueden seguir teniendo inventario asignado; se
    // necesitan también para mostrar su nombre en la tabla (no para el selector
    // de ajuste, que solo debe ofrecer almacenes activos).
    client
      .listWarehouses(accessToken, { pageSize: 100 })
      .then((result) => setAllWarehouses(result.items))
      .catch(() => setAllWarehouses([]));
  }, [client, accessToken]);

  const loadInventory = useCallback(async () => {
    if (!accessToken) return;

    try {
      const result = await client.listInventory(accessToken, {
        page,
        pageSize: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(warehouseFilter ? { warehouseId: warehouseFilter } : {}),
        ...(belowSafetyStock ? { belowSafetyStock: true } : {}),
      });
      setItems(result.items);
      setTotal(result.total);
      setSafetyDrafts(
        Object.fromEntries(result.items.map((item) => [item.id, String(item.safetyStock)])),
      );
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el inventario.');
    }
  }, [client, accessToken, page, search, warehouseFilter, belowSafetyStock]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  async function handleSaveSafetyStock(item: InventoryListItem) {
    if (!accessToken) return;
    const draft = Number(safetyDrafts[item.id]);
    if (Number.isNaN(draft) || draft === item.safetyStock) return;

    setSavingId(item.id);

    try {
      await client.setSafetyStock(accessToken, {
        variantId: item.variantId,
        warehouseId: item.warehouseId,
        safetyStock: draft,
      });
      await loadInventory();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar el umbral.');
    } finally {
      setSavingId(null);
    }
  }

  const warehousesById = useMemo(
    () => new Map(allWarehouses.map((w) => [w.id, w])),
    [allWarehouses],
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Inventario</h1>

      {canManage && accessToken && (
        <AdjustInventoryForm
          accessToken={accessToken}
          client={client}
          warehouses={warehouses}
          onAdjusted={() => void loadInventory()}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por SKU o producto"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="w-64 rounded-md border border-neutral-200 px-3 py-2 text-sm"
        />
        <select
          value={warehouseFilter}
          onChange={(event) => setWarehouseFilter(event.target.value)}
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
        >
          <option value="">Todos los almacenes</option>
          {allWarehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={belowSafetyStock}
            onChange={(event) => setBelowSafetyStock(event.target.checked)}
          />
          Bajo el umbral de seguridad
        </label>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <DataTable<InventoryListItem>
        isLoading={!items}
        rows={items ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin inventario todavía"
        emptyDescription="Usa el formulario de arriba para registrar el primer movimiento."
        columns={[
          { key: 'sku', header: 'SKU', render: (row) => row.variant?.sku ?? row.variantId },
          {
            key: 'product',
            header: 'Producto',
            render: (row) =>
              row.variant ? `${row.variant.productName} — ${row.variant.title}` : '—',
          },
          {
            key: 'warehouse',
            header: 'Almacén',
            render: (row) => warehousesById.get(row.warehouseId)?.name ?? row.warehouseId,
          },
          { key: 'available', header: 'Disponible', render: (row) => row.availableQuantity },
          { key: 'reserved', header: 'Reservado', render: (row) => row.reservedQuantity },
          { key: 'incoming', header: 'Por llegar', render: (row) => row.incomingQuantity },
          {
            key: 'safetyStock',
            header: 'Umbral',
            render: (row) =>
              canManage ? (
                <Input
                  type="number"
                  min={0}
                  className="w-20"
                  value={safetyDrafts[row.id] ?? ''}
                  onChange={(event) =>
                    setSafetyDrafts((prev) => ({ ...prev, [row.id]: event.target.value }))
                  }
                  onBlur={() => void handleSaveSafetyStock(row)}
                  disabled={savingId === row.id}
                />
              ) : (
                row.safetyStock
              ),
          },
          {
            key: 'status',
            header: 'Estado',
            render: (row) =>
              row.isBelowSafetyStock ? (
                <span className="text-danger-600">Bajo umbral</span>
              ) : (
                <span className="text-neutral-500">OK</span>
              ),
          },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <Link
                href={`/inventory/movements?variantId=${row.variantId}&warehouseId=${row.warehouseId}`}
                className="text-brand-600 text-sm hover:underline"
              >
                Movimientos
              </Link>
            ),
          },
        ]}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
