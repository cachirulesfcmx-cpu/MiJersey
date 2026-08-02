'use client';

import type {
  CustomerInsights,
  ExecutiveDashboardView,
  ExportReportType,
  SalesReportView,
  TopProduct,
} from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { DataTable, FormField, Input, KpiCard, Skeleton } from '@mijersey/ui';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Executive Dashboard + reportes (spec 032 §6/§7) — un único rango de fechas controla las cuatro consultas (dashboard/ventas/clientes/productos), cada una cacheada por separado en el backend (`AnalyticsCacheService`, TTL). El CRUD de dashboards configurables vive en /analytics/dashboards (spec §12), separado de esta vista de solo lectura. */
export default function AnalyticsPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [from, setFrom] = useState(() => daysAgoIso(30));
  const [to, setTo] = useState(() => todayIso());

  const [dashboard, setDashboard] = useState<ExecutiveDashboardView | null>(null);
  const [sales, setSales] = useState<SalesReportView | null>(null);
  const [customers, setCustomers] = useState<CustomerInsights | null>(null);
  const [products, setProducts] = useState<TopProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<ExportReportType | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setDashboard(null);
    setSales(null);
    setCustomers(null);
    setProducts(null);
    try {
      const [dashboardResult, salesResult, customersResult, productsResult] = await Promise.all([
        client.getExecutiveDashboard(accessToken, { from, to }),
        client.getSalesReport(accessToken, { from, to }),
        client.getCustomerInsights(accessToken, { from, to, limit: 10 }),
        client.getProductPerformance(accessToken, { from, to, limit: 10 }),
      ]);
      setDashboard(dashboardResult);
      setSales(salesResult);
      setCustomers(customersResult);
      setProducts(productsResult);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar la analítica.');
    }
  }, [client, accessToken, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleExport = useCallback(
    async (type: ExportReportType) => {
      if (!accessToken) return;
      setExporting(type);
      setError(null);
      try {
        const result = await client.exportAnalyticsReport(accessToken, { type, from, to });
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        link.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'No se pudo exportar el reporte.');
      } finally {
        setExporting(null);
      }
    },
    [client, accessToken, from, to],
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Analítica</h1>
        <Link href="/analytics/dashboards" className="text-primary-600 text-sm hover:underline">
          Dashboards configurables
        </Link>
      </div>

      <section className="flex flex-wrap items-end gap-4">
        <FormField label="Desde" htmlFor="analytics-from">
          <Input
            id="analytics-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </FormField>
        <FormField label="Hasta" htmlFor="analytics-to">
          <Input id="analytics-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </FormField>
      </section>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {dashboard ? (
          <>
            <KpiCard label="Pedidos" value={dashboard.orderCount} />
            <KpiCard
              label="Ingresos"
              value={`${dashboard.revenue} ${dashboard.currency ?? ''}`.trim()}
            />
            <KpiCard label="Ticket promedio" value={dashboard.averageOrderValue} />
            <KpiCard label="Clientes nuevos" value={dashboard.newCustomers} />
            <KpiCard label="Productos activos" value={dashboard.activeProducts} />
          </>
        ) : (
          Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-neutral-900">Tendencia de ventas</h2>
          <button
            type="button"
            onClick={() => void handleExport('sales')}
            disabled={exporting === 'sales'}
            className="text-primary-600 text-sm hover:underline disabled:text-neutral-400"
          >
            {exporting === 'sales' ? 'Exportando…' : 'Exportar CSV'}
          </button>
        </div>
        <DataTable
          isLoading={!sales}
          rows={sales?.trend ?? []}
          getRowKey={(row) => row.date}
          emptyTitle="Sin ventas en el rango seleccionado"
          columns={[
            { key: 'date', header: 'Fecha', render: (row) => row.date },
            { key: 'orderCount', header: 'Pedidos', render: (row) => row.orderCount },
            { key: 'revenue', header: 'Ingresos', render: (row) => row.revenue },
          ]}
        />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-neutral-900">
            Clientes ({customers?.newCustomers ?? 0} nuevos · {customers?.returningCustomers ?? 0}{' '}
            recurrentes)
          </h2>
          <button
            type="button"
            onClick={() => void handleExport('customers')}
            disabled={exporting === 'customers'}
            className="text-primary-600 text-sm hover:underline disabled:text-neutral-400"
          >
            {exporting === 'customers' ? 'Exportando…' : 'Exportar CSV'}
          </button>
        </div>
        <DataTable
          isLoading={!customers}
          rows={customers?.topCustomers ?? []}
          getRowKey={(row) => row.customerId}
          emptyTitle="Sin clientes en el rango seleccionado"
          columns={[
            { key: 'name', header: 'Cliente', render: (row) => row.name },
            { key: 'email', header: 'Email', render: (row) => row.email },
            { key: 'orderCount', header: 'Pedidos', render: (row) => row.orderCount },
            { key: 'totalSpent', header: 'Total gastado', render: (row) => row.totalSpent },
          ]}
        />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-neutral-900">Productos más vendidos</h2>
          <button
            type="button"
            onClick={() => void handleExport('products')}
            disabled={exporting === 'products'}
            className="text-primary-600 text-sm hover:underline disabled:text-neutral-400"
          >
            {exporting === 'products' ? 'Exportando…' : 'Exportar CSV'}
          </button>
        </div>
        <DataTable
          isLoading={!products}
          rows={products ?? []}
          getRowKey={(row) => row.productId}
          emptyTitle="Sin productos vendidos en el rango seleccionado"
          columns={[
            { key: 'name', header: 'Producto', render: (row) => row.name },
            { key: 'sku', header: 'SKU', render: (row) => row.sku },
            { key: 'unitsSold', header: 'Unidades', render: (row) => row.unitsSold },
            { key: 'revenue', header: 'Ingresos', render: (row) => row.revenue },
          ]}
        />
      </section>

      <section className="flex items-center justify-between rounded-lg border border-neutral-200 p-4">
        <span className="text-sm text-neutral-600">
          Eventos de analítica (colector interno) registrados en el rango.
        </span>
        <button
          type="button"
          onClick={() => void handleExport('events')}
          disabled={exporting === 'events'}
          className="text-primary-600 text-sm hover:underline disabled:text-neutral-400"
        >
          {exporting === 'events' ? 'Exportando…' : 'Exportar eventos CSV'}
        </button>
      </section>
    </div>
  );
}
