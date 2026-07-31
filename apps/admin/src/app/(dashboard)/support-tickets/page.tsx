'use client';

import type { Ticket, TicketPriority, TicketStatus } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { DataTable, FormField, Pagination } from '@mijersey/ui';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 20;
const STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'];
const PRIORITIES: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En progreso',
  WAITING_CUSTOMER: 'Esperando al cliente',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

/** Support Dashboard (spec 025 §6) — lista de tickets con filtros e indicadores de SLA; el detalle y la respuesta viven en `/support/[id]`. */
export default function SupportDashboardPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listAllTickets(accessToken, {
        page,
        pageSize: PAGE_SIZE,
        ...(status ? { status: status as TicketStatus } : {}),
        ...(priority ? { priority: priority as TicketPriority } : {}),
      });
      setTickets(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los tickets.');
    }
  }, [client, accessToken, page, status, priority]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Atención al cliente</h1>

      <div className="flex gap-4">
        <FormField label="Estado" htmlFor="status-filter">
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
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Prioridad" htmlFor="priority-filter">
          <select
            id="priority-filter"
            value={priority}
            onChange={(event) => {
              setPage(1);
              setPriority(event.target.value);
            }}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <DataTable<Ticket>
        isLoading={!tickets}
        rows={tickets ?? []}
        getRowKey={(ticket) => ticket.id}
        emptyTitle="Sin tickets"
        columns={[
          { key: 'ticketNumber', header: 'Ticket', render: (t) => t.ticketNumber },
          { key: 'subject', header: 'Asunto', render: (t) => t.subject },
          { key: 'category', header: 'Categoría', render: (t) => t.category },
          { key: 'priority', header: 'Prioridad', render: (t) => t.priority },
          { key: 'status', header: 'Estado', render: (t) => STATUS_LABELS[t.status] },
          {
            key: 'sla',
            header: 'SLA',
            render: (t) =>
              t.resolutionBreached ? (
                <span className="text-danger-600 font-medium">Incumplido</span>
              ) : t.firstResponseBreached ? (
                <span className="font-medium text-amber-600">1ª resp. tardía</span>
              ) : (
                <span className="text-success-600">En tiempo</span>
              ),
          },
          {
            key: 'date',
            header: 'Fecha',
            render: (t) => new Date(t.createdAt).toLocaleString('es-MX'),
          },
          {
            key: 'actions',
            header: '',
            render: (t) => (
              <Link
                href={`/support-tickets/${t.id}`}
                className="text-brand-600 text-sm hover:underline"
              >
                Ver
              </Link>
            ),
          },
        ]}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
