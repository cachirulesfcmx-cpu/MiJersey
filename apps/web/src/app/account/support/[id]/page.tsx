'use client';

import type { Ticket, TicketMessage } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, Skeleton } from '@mijersey/ui';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Breadcrumbs } from '../../../../components/plp/Breadcrumbs';
import {
  INPUT_OVERRIDE_CLASS,
  PRIMARY_BUTTON_OVERRIDE_CLASS,
} from '../../../../components/ui/form-styles';
import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';

const STATUS_LABELS: Record<Ticket['status'], string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En progreso',
  WAITING_CUSTOMER: 'Esperando tu respuesta',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString('es-MX');
}

/** Detalle de ticket del cliente (spec 025 §6): Conversation Timeline + Reply Editor. Las notas internas de agentes nunca llegan aquí — el backend las filtra (`ListTicketMessagesUseCase`). */
export default function MyTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [ticketResult, messagesResult] = await Promise.all([
        client.getMyTicket(accessToken, params.id),
        client.listMyTicketMessages(accessToken, params.id, { pageSize: 100 }),
      ]);
      setTicket(ticketResult);
      setMessages(messagesResult.items);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el ticket.');
    }
  }, [client, accessToken, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleReply(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken || !replyMessage.trim()) return;
    setIsReplying(true);
    setError(null);
    try {
      await client.replyToMyTicket(accessToken, params.id, { message: replyMessage });
      setReplyMessage('');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo enviar tu respuesta.');
    } finally {
      setIsReplying(false);
    }
  }

  if (error && !ticket) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-6">
        <p className="text-danger-600 text-sm">{error}</p>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  const isClosed = ticket.status === 'CLOSED';

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: 'Cuenta', href: '/account' },
          { label: 'Mis tickets', href: '/account/support' },
          { label: ticket.ticketNumber },
        ]}
      />

      <div>
        <h1 className="section-heading">{ticket.subject}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {ticket.ticketNumber} · <span className="badge-pop">{STATUS_LABELS[ticket.status]}</span>
        </p>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <div className="flex flex-col gap-3">
        {messages.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin mensajes todavía.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-2xl p-4 text-sm ${
                message.authorType === 'AGENT'
                  ? 'self-start bg-neutral-100'
                  : 'bg-pop-500/10 self-end'
              }`}
            >
              <p className="mb-1 text-xs text-neutral-500">
                {message.authorType === 'AGENT' ? 'Soporte' : 'Tú'} ·{' '}
                {formatDate(message.createdAt)}
              </p>
              <p className="whitespace-pre-wrap text-neutral-800">{message.message}</p>
            </div>
          ))
        )}
      </div>

      {isClosed ? (
        <p className="text-sm text-neutral-500">Este ticket está cerrado.</p>
      ) : (
        <form onSubmit={(event) => void handleReply(event)} className="flex flex-col gap-3">
          <textarea
            value={replyMessage}
            onChange={(event) => setReplyMessage(event.target.value)}
            rows={4}
            placeholder="Escribe tu mensaje…"
            className={INPUT_OVERRIDE_CLASS}
            required
          />
          <Button
            type="submit"
            isLoading={isReplying}
            className={`!self-start ${PRIMARY_BUTTON_OVERRIDE_CLASS}`}
          >
            Enviar
          </Button>
        </form>
      )}
    </main>
  );
}
