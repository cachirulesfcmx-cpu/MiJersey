'use client';

import type { AuditLogEntry, DashboardMetrics } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { KpiCard, Skeleton } from '@mijersey/ui';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';
import { useAuth } from '../../providers/auth-provider';

const SKELETON_COUNT = 8;

export default function DashboardPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activity, setActivity] = useState<AuditLogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    Promise.all([client.getDashboardMetrics(accessToken), client.getRecentActivity(accessToken)])
      .then(([metricsResult, activityResult]) => {
        setMetrics(metricsResult);
        setActivity(activityResult);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el dashboard.');
      });
  }, [client, accessToken]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {metrics ? (
          <>
            <KpiCard
              label="Clientes"
              value={metrics.customers.value}
              available={metrics.customers.available}
            />
            <KpiCard
              label="Staff"
              value={metrics.staff.value}
              available={metrics.staff.available}
            />
            <KpiCard
              label="Usuarios activos"
              value={metrics.activeUsers.value}
              available={metrics.activeUsers.available}
            />
            <KpiCard
              label="Ventas"
              value={metrics.sales.value}
              available={metrics.sales.available}
              hint="Llega con el módulo de Pedidos"
            />
            <KpiCard
              label="Pedidos"
              value={metrics.orders.value}
              available={metrics.orders.available}
              hint="Llega con el módulo de Pedidos"
            />
            <KpiCard
              label="Productos"
              value={metrics.products.value}
              available={metrics.products.available}
              hint="Llega con el módulo de Catálogo"
            />
            <KpiCard
              label="Ingresos"
              value={metrics.revenue.value}
              available={metrics.revenue.available}
              hint="Llega con el módulo de Pedidos"
            />
            <KpiCard
              label="Alertas de inventario"
              value={metrics.inventoryAlerts.value}
              available={metrics.inventoryAlerts.available}
              hint="Llega con el módulo de Inventario"
            />
          </>
        ) : (
          Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-neutral-900">Actividad reciente</h2>

        {!activity && <Skeleton className="h-40 w-full" />}
        {activity && activity.length === 0 && (
          <p className="text-sm text-neutral-500">Sin actividad todavía.</p>
        )}

        {activity && activity.length > 0 && (
          <ul className="flex flex-col gap-2">
            {activity.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between rounded-md border border-neutral-200 p-3 text-sm"
              >
                <span className="text-neutral-900">{entry.action}</span>
                <span className="text-neutral-400">
                  {new Date(entry.createdAt).toLocaleString('es-MX')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
