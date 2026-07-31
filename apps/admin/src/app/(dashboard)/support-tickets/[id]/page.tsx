'use client';

import type { Ticket, TicketMessage, TicketPriority, TicketStatus } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';

const STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'];
const PRIORITIES: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

function formatDate(value: string): string {
  return new Date(value).toLocaleString('es-MX');
}

/** Detalle de ticket (spec 025 §6): Ticket Detail + Conversation Timeline + Reply Editor + SLA Indicators. Las notas internas (`isInternal`) solo son visibles y creables aquí — el cliente nunca las ve, ver `docs/customer-service.md`. */
export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const [status, setStatus] = useState<TicketStatus>('OPEN');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [isSavingTicket, setIsSavingTicket] = useState(false);

  const loadTicket = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [ticketResult, messagesResult] = await Promise.all([
        client.getTicket(accessToken, params.id),
        client.listTicketMessages(accessToken, params.id, { pageSize: 100 }),
      ]);
      setTicket(ticketResult);
      setMessages(messagesResult.items);
      setStatus(ticketResult.status);
      setPriority(ticketResult.priority);
      setAssignedAgentId(ticketResult.assignedAgentId ?? '');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el ticket.');
    }
  }, [client, accessToken, params.id]);

  useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  async function handleReply(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken || !replyMessage.trim()) return;
    setIsReplying(true);
    setError(null);
    try {
      await client.replyToTicket(accessToken, params.id, { message: replyMessage, isInternal });
      setReplyMessage('');
      setIsInternal(false);
      await loadTicket();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo enviar la respuesta.');
    } finally {
      setIsReplying(false);
    }
  }

  async function handleUpdateTicket(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSavingTicket(true);
    setError(null);
    try {
      await client.updateTicket(accessToken, params.id, {
        status,
        priority,
        assignedAgentId: assignedAgentId.trim() ? assignedAgentId.trim() : null,
      });
      await loadTicket();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo actualizar el ticket.');
    } finally {
      setIsSavingTicket(false);
    }
  }

  if (error && !ticket) return <p className="text-danger-600 text-sm">{error}</p>;
  if (!ticket) return <p className="text-sm text-neutral-500">Cargando…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{ticket.ticketNumber}</h1>
        <p className="text-sm text-neutral-600">{ticket.subject}</p>
      </div>

      <div className="flex flex-wrap gap-4 rounded-md border border-neutral-200 p-4 text-sm">
        <span>
          Categoría: <strong>{ticket.category}</strong>
        </span>
        <span>
          Prioridad: <strong>{ticket.priority}</strong>
        </span>
        <span>
          Estado: <strong>{ticket.status}</strong>
        </span>
        {ticket.orderId && (
          <span>
            Pedido: <strong>{ticket.orderId}</strong>
          </span>
        )}
        <span className={ticket.firstResponseBreached ? 'text-danger-600 font-medium' : ''}>
          1ª respuesta límite: {formatDate(ticket.firstResponseDueAt)}
          {ticket.firstResponseBreached && ' (incumplida)'}
        </span>
        <span className={ticket.resolutionBreached ? 'text-danger-600 font-medium' : ''}>
          Resolución límite: {formatDate(ticket.resolutionDueAt)}
          {ticket.resolutionBreached && ' (incumplida)'}
        </span>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <div className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Conversación</h2>
        {messages.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin mensajes todavía.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-md border p-3 text-sm ${
                message.isInternal
                  ? 'border-amber-200 bg-amber-50'
                  : message.authorType === 'AGENT'
                    ? 'border-brand-100 bg-brand-50'
                    : 'border-neutral-200 bg-white'
              }`}
            >
              <div className="mb-1 flex justify-between text-xs text-neutral-500">
                <span>
                  {message.authorType === 'AGENT'
                    ? 'Agente'
                    : message.authorType === 'CUSTOMER'
                      ? 'Cliente'
                      : 'Sistema'}
                  {message.isInternal && ' · Nota interna'}
                </span>
                <span>{formatDate(message.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-neutral-800">{message.message}</p>
              {message.attachments.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1">
                  {message.attachments.map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 text-xs hover:underline"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={(event) => void handleReply(event)} className="flex flex-col gap-3">
        <FormField label="Responder" htmlFor="reply-message">
          <textarea
            id="reply-message"
            value={replyMessage}
            onChange={(event) => setReplyMessage(event.target.value)}
            rows={4}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            required
          />
        </FormField>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(event) => setIsInternal(event.target.checked)}
          />
          Nota interna (no visible para el cliente)
        </label>
        <Button type="submit" isLoading={isReplying} className="self-start">
          Enviar
        </Button>
      </form>

      <form
        onSubmit={(event) => void handleUpdateTicket(event)}
        className="flex flex-wrap items-end gap-4 rounded-md border border-neutral-200 p-4"
      >
        <FormField label="Estado" htmlFor="ticket-status">
          <select
            id="ticket-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as TicketStatus)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Prioridad" htmlFor="ticket-priority">
          <select
            id="ticket-priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as TicketPriority)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Agente asignado (id)" htmlFor="assigned-agent">
          <input
            id="assigned-agent"
            value={assignedAgentId}
            onChange={(event) => setAssignedAgentId(event.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            placeholder="Sin asignar"
          />
        </FormField>
        <Button type="submit" isLoading={isSavingTicket}>
          Guardar
        </Button>
      </form>
    </div>
  );
}
