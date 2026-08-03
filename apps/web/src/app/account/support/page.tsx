'use client';

import type { Ticket } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Skeleton } from '@mijersey/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Breadcrumbs } from '../../../components/plp/Breadcrumbs';
import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const STATUS_LABELS: Record<Ticket['status'], string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En progreso',
  WAITING_CUSTOMER: 'Esperando tu respuesta',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

/** "Mis tickets" (spec 025 §6, storefront) — lista de tickets propios del cliente, ver `docs/customer-service.md`. */
export default function MyTicketsPage() {
  const { user, accessToken, isLoading } = useAuth();
  const router = useRouter();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listMyTickets(accessToken, { pageSize: 50 });
      setTickets(result.items);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar tus tickets.');
    }
  }, [client, accessToken]);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login');
  }, [isLoading, user, router]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ label: 'Cuenta', href: '/account' }, { label: 'Mis tickets' }]} />

      <div className="flex items-center justify-between">
        <h1 className="section-heading">Mis tickets</h1>
        <Link href="/account/support/new" className="btn-pop-sm">
          Nuevo ticket
        </Link>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      {!tickets && !error && (
        <div className="flex flex-col gap-2">
          <Skeleton className="skeleton-arena h-16 w-full" />
          <Skeleton className="skeleton-arena h-16 w-full" />
        </div>
      )}

      {tickets && tickets.length === 0 && (
        <p className="text-sm text-neutral-500">Todavía no has creado ningún ticket.</p>
      )}

      <ul className="flex flex-col gap-3">
        {tickets?.map((ticket) => (
          <li key={ticket.id}>
            <Link href={`/account/support/${ticket.id}`} className="card-arena flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-900">{ticket.subject}</span>
                <span className="text-xs text-neutral-500">{ticket.ticketNumber}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-neutral-500">
                <span className="badge-pop">{STATUS_LABELS[ticket.status]}</span>
                <span>{new Date(ticket.createdAt).toLocaleDateString('es-MX')}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
