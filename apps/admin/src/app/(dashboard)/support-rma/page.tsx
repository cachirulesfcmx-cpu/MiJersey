'use client';

import type { RmaRequest, RmaStatus } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { DataTable, FormField, Pagination } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 20;
const STATUSES: RmaStatus[] = ['REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED'];

const STATUS_LABELS: Record<RmaStatus, string> = {
  REQUESTED: 'Solicitada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  COMPLETED: 'Completada',
};

/** Gestión de devoluciones (RMA) preparada (spec 025 §2/§4) — administra el estado de la solicitud; no genera un envío de retorno real en Shipping (023), ver `docs/customer-service.md`. */
export default function SupportRmaPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [rmaRequests, setRmaRequests] = useState<RmaRequest[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listRma(accessToken, {
        page,
        pageSize: PAGE_SIZE,
        ...(status ? { status: status as RmaStatus } : {}),
      });
      setRmaRequests(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar las devoluciones.',
      );
    }
  }, [client, accessToken, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpdateStatus(id: string, nextStatus: RmaStatus) {
    if (!accessToken) return;
    setUpdatingId(id);
    try {
      await client.updateRmaStatus(accessToken, id, { status: nextStatus });
      await load();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudo actualizar la devolución.',
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Devoluciones (RMA)</h1>

      <FormField label="Estado" htmlFor="rma-status-filter">
        <select
          id="rma-status-filter"
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Todas</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </FormField>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <DataTable<RmaRequest>
        isLoading={!rmaRequests}
        rows={rmaRequests ?? []}
        getRowKey={(rma) => rma.id}
        emptyTitle="Sin solicitudes de devolución"
        columns={[
          { key: 'rmaNumber', header: 'RMA', render: (rma) => rma.rmaNumber },
          { key: 'orderId', header: 'Pedido', render: (rma) => rma.orderId },
          { key: 'reason', header: 'Motivo', render: (rma) => rma.reason },
          { key: 'status', header: 'Estado', render: (rma) => STATUS_LABELS[rma.status] },
          {
            key: 'date',
            header: 'Fecha',
            render: (rma) => new Date(rma.createdAt).toLocaleString('es-MX'),
          },
          {
            key: 'actions',
            header: '',
            render: (rma) => (
              <select
                value={rma.status}
                disabled={updatingId === rma.id}
                onChange={(event) =>
                  void handleUpdateStatus(rma.id, event.target.value as RmaStatus)
                }
                className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
              >
                {STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            ),
          },
        ]}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
