'use client';

import type { Notification, NotificationChannel, NotificationStatus } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, DataTable, FormField, Input, Pagination } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 20;
const CHANNELS: NotificationChannel[] = ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH'];
const STATUSES: NotificationStatus[] = ['QUEUED', 'SENT', 'DELIVERED', 'FAILED'];

const STATUS_LABELS: Record<NotificationStatus, string> = {
  QUEUED: 'En cola',
  SENT: 'Enviada',
  DELIVERED: 'Entregada',
  FAILED: 'Fallida',
};

/** Admin Dashboard / Delivery Status / Retry Manager (034 §6) en una sola vista — bitácora completa (todas las notificaciones, no solo las del cliente autenticado, a diferencia de `/notifications` self-service), filtrable, con reintento para las `FAILED` y una consola de prueba equivalente a la de Tracking (033). */
export default function NotificationsPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | ''>('');
  const [channelFilter, setChannelFilter] = useState<NotificationChannel | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const [testChannel, setTestChannel] = useState<NotificationChannel>('EMAIL');
  const [testTemplateKey, setTestTemplateKey] = useState('order.confirmation');
  const [testRecipient, setTestRecipient] = useState('');
  const [testPayloadJson, setTestPayloadJson] = useState('{}');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listNotifications(accessToken, {
        page,
        pageSize: PAGE_SIZE,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(channelFilter ? { channel: channelFilter } : {}),
      });
      setNotifications(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar las notificaciones.',
      );
    }
  }, [client, accessToken, page, statusFilter, channelFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRetry(id: string) {
    if (!accessToken) return;
    setRetryingId(id);
    setError(null);
    try {
      await client.retryNotification(accessToken, id);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudo reintentar la notificación.',
      );
    } finally {
      setRetryingId(null);
    }
  }

  async function handleSendTest() {
    if (!accessToken) return;
    setIsSendingTest(true);
    setTestResult(null);
    setError(null);
    try {
      const payload: Record<string, unknown> = JSON.parse(testPayloadJson);
      const notification = await client.testNotification(accessToken, {
        channel: testChannel,
        templateKey: testTemplateKey,
        recipient: testRecipient,
        payload,
      });
      setTestResult(
        `Resultado: ${STATUS_LABELS[notification.status]}${notification.lastError ? ` (${notification.lastError})` : ''}`,
      );
      await load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? `Payload inválido: ${err.message}`
            : 'No se pudo enviar la notificación de prueba.',
      );
    } finally {
      setIsSendingTest(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Notificaciones</h1>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <section className="flex flex-col gap-4 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-lg font-medium text-neutral-900">Enviar notificación de prueba</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="Canal" htmlFor="test-channel">
            <select
              id="test-channel"
              value={testChannel}
              onChange={(e) => setTestChannel(e.target.value as NotificationChannel)}
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
            >
              {CHANNELS.map((channel) => (
                <option key={channel} value={channel}>
                  {channel}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Clave de plantilla" htmlFor="test-template-key">
            <Input
              id="test-template-key"
              value={testTemplateKey}
              onChange={(e) => setTestTemplateKey(e.target.value)}
            />
          </FormField>
          <FormField label="Destinatario" htmlFor="test-recipient">
            <Input
              id="test-recipient"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="correo@ejemplo.com o +52..."
            />
          </FormField>
        </div>
        <FormField label="Payload (JSON)" htmlFor="test-payload">
          <textarea
            id="test-payload"
            value={testPayloadJson}
            onChange={(e) => setTestPayloadJson(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 font-mono text-xs text-neutral-900"
          />
        </FormField>
        {testResult && <p className="text-sm text-neutral-600">{testResult}</p>}
        <div>
          <Button
            onClick={() => void handleSendTest()}
            isLoading={isSendingTest}
            disabled={!testRecipient}
          >
            Enviar prueba
          </Button>
        </div>
      </section>

      <section className="flex flex-wrap items-end gap-4">
        <FormField label="Estado" htmlFor="status-filter">
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value as NotificationStatus | '');
            }}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Canal" htmlFor="channel-filter">
          <select
            id="channel-filter"
            value={channelFilter}
            onChange={(e) => {
              setPage(1);
              setChannelFilter(e.target.value as NotificationChannel | '');
            }}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            {CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </select>
        </FormField>
      </section>

      <DataTable<Notification>
        isLoading={!notifications}
        rows={notifications ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin notificaciones registradas"
        columns={[
          { key: 'channel', header: 'Canal', render: (row) => row.channel },
          { key: 'templateKey', header: 'Plantilla', render: (row) => row.templateKey },
          { key: 'recipient', header: 'Destinatario', render: (row) => row.recipient },
          { key: 'status', header: 'Estado', render: (row) => STATUS_LABELS[row.status] },
          { key: 'retryCount', header: 'Reintentos', render: (row) => row.retryCount },
          {
            key: 'lastError',
            header: 'Último error',
            render: (row) => row.lastError ?? '—',
          },
          {
            key: 'createdAt',
            header: 'Fecha',
            render: (row) => new Date(row.createdAt).toLocaleString('es-MX'),
          },
          {
            key: 'actions',
            header: '',
            render: (row) =>
              row.status === 'FAILED' ? (
                <Button
                  variant="secondary"
                  onClick={() => void handleRetry(row.id)}
                  isLoading={retryingId === row.id}
                >
                  Reintentar
                </Button>
              ) : null,
          },
        ]}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
