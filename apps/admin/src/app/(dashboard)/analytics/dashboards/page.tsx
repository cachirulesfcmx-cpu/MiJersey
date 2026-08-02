'use client';

import type { AnalyticsDashboard, AnalyticsWidget } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, ConfirmDialog, DataTable, FormField, Input } from '@mijersey/ui';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';

const EMPTY_WIDGETS_JSON = '[]';

function parseWidgets(raw: string): AnalyticsWidget[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('widgets debe ser un arreglo');
  return parsed as AnalyticsWidget[];
}

/** CRUD de dashboards configurables (spec 032 §12) — los widgets se editan como JSON crudo en vez de un builder visual, mismo criterio "campos mínimos" usado en Site Configuration (030) para las integraciones/policies. */
export default function AnalyticsDashboardsPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [dashboards, setDashboards] = useState<AnalyticsDashboard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [widgetsJson, setWidgetsJson] = useState(EMPTY_WIDGETS_JSON);
  const [isCreating, setIsCreating] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<AnalyticsDashboard | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listAnalyticsDashboards(accessToken);
      setDashboards(result);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar los dashboards.',
      );
    }
  }, [client, accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    if (!accessToken || !name.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      const widgets = parseWidgets(widgetsJson);
      await client.createAnalyticsDashboard(accessToken, { name: name.trim(), widgets });
      setName('');
      setWidgetsJson(EMPTY_WIDGETS_JSON);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? `JSON de widgets inválido: ${err.message}`
            : 'No se pudo crear el dashboard.',
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete() {
    if (!accessToken || !pendingDelete) return;
    setIsDeleting(true);
    try {
      await client.deleteAnalyticsDashboard(accessToken, pendingDelete.id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar el dashboard.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboards configurables</h1>
        <Link href="/analytics" className="text-primary-600 text-sm hover:underline">
          Volver a Analítica
        </Link>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <section className="flex flex-col gap-4 rounded-lg border border-neutral-200 p-4">
        <h2 className="text-lg font-medium text-neutral-900">Nuevo dashboard</h2>
        <FormField label="Nombre" htmlFor="dashboard-name">
          <Input id="dashboard-name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField
          label="Widgets (JSON)"
          htmlFor="dashboard-widgets"
          hint='Arreglo de { "id", "type": "sales"|"customers"|"products"|"events"|"kpi", "title", "config" }'
        >
          <textarea
            id="dashboard-widgets"
            value={widgetsJson}
            onChange={(e) => setWidgetsJson(e.target.value)}
            rows={6}
            className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 font-mono text-xs text-neutral-900"
          />
        </FormField>
        <div>
          <Button
            onClick={() => void handleCreate()}
            isLoading={isCreating}
            disabled={!name.trim()}
          >
            Crear dashboard
          </Button>
        </div>
      </section>

      <DataTable<AnalyticsDashboard>
        isLoading={!dashboards}
        rows={dashboards ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin dashboards configurados"
        columns={[
          { key: 'name', header: 'Nombre', render: (row) => row.name },
          { key: 'widgets', header: 'Widgets', render: (row) => row.widgets.length },
          {
            key: 'updatedAt',
            header: 'Actualizado',
            render: (row) => new Date(row.updatedAt).toLocaleString('es-MX'),
          },
          {
            key: 'actions',
            header: '',
            render: (row) => (
              <Button variant="danger" onClick={() => setPendingDelete(row)}>
                Eliminar
              </Button>
            ),
          },
        ]}
      />

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title={`¿Eliminar "${pendingDelete?.name ?? ''}"?`}
        description="Esta acción no se puede deshacer."
        isDestructive
        isConfirming={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
