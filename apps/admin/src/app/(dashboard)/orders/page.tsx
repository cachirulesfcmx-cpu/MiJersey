'use client';

import type { OrderSummary } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { DataTable, FormField, Pagination } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 20;
const STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED'] as const;

function formatPrice(amount: number, currency: string): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency });
}

/** Orders Dashboard (spec 021 §6) — solo lectura por ahora; el ciclo de vida de cada pedido (cancelar, línea de tiempo, reordenar) es una capacidad del cliente en el storefront, no de administración, ver docs/orders.md. */
export default function OrdersPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listAllOrders(accessToken, {
        page,
        pageSize: PAGE_SIZE,
        ...(status ? { status } : {}),
      });
      setOrders(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los pedidos.');
    }
  }, [client, accessToken, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Pedidos</h1>

      <FormField label="Filtrar por estado" htmlFor="status-filter">
        <select
          id="status-filter"
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </FormField>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <DataTable<OrderSummary>
        isLoading={!orders}
        rows={orders ?? []}
        getRowKey={(order) => order.id}
        emptyTitle="Sin pedidos"
        columns={[
          { key: 'orderNumber', header: 'Pedido', render: (order) => order.orderNumber },
          { key: 'status', header: 'Estado', render: (order) => order.status },
          { key: 'payment', header: 'Pago', render: (order) => order.paymentStatus },
          { key: 'fulfillment', header: 'Envío', render: (order) => order.fulfillmentStatus },
          { key: 'items', header: 'Artículos', render: (order) => String(order.itemCount) },
          {
            key: 'total',
            header: 'Total',
            render: (order) => formatPrice(order.grandTotal, order.currency),
          },
          {
            key: 'date',
            header: 'Fecha',
            render: (order) => new Date(order.createdAt).toLocaleString('es-MX'),
          },
        ]}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
