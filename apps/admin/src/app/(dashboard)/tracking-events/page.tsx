'use client';

import type { TrackingEvent, TrackingProvider } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, DataTable, FormField, Input, Pagination } from '@mijersey/ui';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 20;

/** Bitácora de eventos + "Debug Console" (033 §6) — envía un evento de prueba a un proveedor configurado y lo agrega de inmediato a la tabla (fuente `admin-test`), sin pasar por deduplicación ni consentimiento (acción explícita del administrador). */
export default function TrackingEventsPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [events, setEvents] = useState<TrackingEvent[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [providers, setProviders] = useState<TrackingProvider[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [testProviderId, setTestProviderId] = useState('');
  const [testEventName, setTestEventName] = useState('purchase');
  const [testPayloadJson, setTestPayloadJson] = useState('{}');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listTrackingEvents(accessToken, { page, pageSize: PAGE_SIZE });
      setEvents(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los eventos.');
    }
  }, [client, accessToken, page]);

  const loadProviders = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listTrackingProviders(accessToken);
      setProviders(result);
      if (result.length > 0 && !testProviderId) setTestProviderId(result[0]!.id);
    } catch {
      // el selector de proveedores es secundario a la bitácora; no bloquea la vista
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  async function handleSendTest() {
    if (!accessToken || !testProviderId) return;
    setIsSendingTest(true);
    setTestResult(null);
    setError(null);
    try {
      const payload: Record<string, unknown> = JSON.parse(testPayloadJson);
      const result = await client.testTrackingEvent(accessToken, {
        providerId: testProviderId,
        eventName: testEventName,
        payload,
      });
      setTestResult(
        result.delivered
          ? 'Evento entregado al proveedor.'
          : 'Proveedor no conectado: el evento quedó registrado en el log del servidor.',
      );
      await load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? `Payload inválido: ${err.message}`
            : 'No se pudo enviar el evento de prueba.',
      );
    } finally {
      setIsSendingTest(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Eventos de tracking</h1>
        <Link href="/tracking-providers" className="text-primary-600 text-sm hover:underline">
          Proveedores
        </Link>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <section className="flex flex-col gap-4 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-lg font-medium text-neutral-900">Debug Console</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="Proveedor" htmlFor="test-provider">
            <select
              id="test-provider"
              value={testProviderId}
              onChange={(e) => setTestProviderId(e.target.value)}
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
            >
              {(providers ?? []).map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.provider}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Nombre del evento" htmlFor="test-event-name">
            <Input
              id="test-event-name"
              value={testEventName}
              onChange={(e) => setTestEventName(e.target.value)}
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
            disabled={!testProviderId}
          >
            Enviar evento de prueba
          </Button>
        </div>
      </section>

      <DataTable<TrackingEvent>
        isLoading={!events}
        rows={events ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin eventos registrados"
        columns={[
          { key: 'eventName', header: 'Evento', render: (row) => row.eventName },
          { key: 'source', header: 'Origen', render: (row) => row.source },
          {
            key: 'consentRequired',
            header: 'Requiere consentimiento',
            render: (row) => (row.consentRequired ? 'Sí' : 'No'),
          },
          {
            key: 'createdAt',
            header: 'Fecha',
            render: (row) => new Date(row.createdAt).toLocaleString('es-MX'),
          },
        ]}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
