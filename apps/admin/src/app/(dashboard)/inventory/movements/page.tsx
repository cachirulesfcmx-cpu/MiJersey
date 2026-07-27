'use client';

import type { InventoryMovement, InventoryMovementType } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { DataTable, Pagination } from '@mijersey/ui';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';

const PAGE_SIZE = 20;

const TYPE_LABELS: Record<InventoryMovementType, string> = {
  INBOUND: 'Entrada',
  OUTBOUND: 'Salida',
  RESERVATION: 'Reserva',
  RELEASE: 'Liberación',
  ADJUSTMENT_POSITIVE: 'Ajuste positivo',
  ADJUSTMENT_NEGATIVE: 'Ajuste negativo',
  RETURN: 'Devolución',
};

export default function InventoryMovementsPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const searchParams = useSearchParams();

  const [variantId] = useState(searchParams.get('variantId') ?? '');
  const [warehouseId] = useState(searchParams.get('warehouseId') ?? '');
  const [typeFilter, setTypeFilter] = useState<InventoryMovementType | ''>('');
  const [page, setPage] = useState(1);

  const [movements, setMovements] = useState<InventoryMovement[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [typeFilter]);

  const loadMovements = useCallback(async () => {
    if (!accessToken) return;

    try {
      const result = await client.listInventoryMovements(accessToken, {
        page,
        pageSize: PAGE_SIZE,
        ...(variantId ? { variantId } : {}),
        ...(warehouseId ? { warehouseId } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
      });
      setMovements(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar los movimientos.',
      );
    }
  }, [client, accessToken, page, variantId, warehouseId, typeFilter]);

  useEffect(() => {
    void loadMovements();
  }, [loadMovements]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Movimientos de inventario</h1>

      {(variantId || warehouseId) && (
        <p className="text-sm text-neutral-500">
          Filtrado {variantId && `por variante ${variantId}`}{' '}
          {warehouseId && `en almacén ${warehouseId}`}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as InventoryMovementType | '')}
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

      <DataTable<InventoryMovement>
        isLoading={!movements}
        rows={movements ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin movimientos todavía"
        columns={[
          {
            key: 'createdAt',
            header: 'Fecha',
            render: (row) => new Date(row.createdAt).toLocaleString(),
          },
          { key: 'type', header: 'Tipo', render: (row) => TYPE_LABELS[row.type] },
          { key: 'quantity', header: 'Cantidad', render: (row) => row.quantity },
          { key: 'reason', header: 'Motivo', render: (row) => row.reason ?? '—' },
          {
            key: 'reference',
            header: 'Referencia',
            render: (row) =>
              row.referenceType && row.referenceId
                ? `${row.referenceType}:${row.referenceId}`
                : '—',
          },
        ]}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
