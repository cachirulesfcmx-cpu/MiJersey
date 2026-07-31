'use client';

import type { PromotionUsageSummary } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { DataTable, Pagination } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 20;

function formatPrice(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

/** Usage Dashboard (spec 024 §6): cada aplicación real de una promoción, registrada al confirmar el checkout (ver `RecordPromotionUsageUseCase`). */
export default function PromotionUsagePage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [usages, setUsages] = useState<PromotionUsageSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listPromotionUsage(accessToken, { page, pageSize: PAGE_SIZE });
      setUsages(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudo cargar el historial de uso.',
      );
    }
  }, [client, accessToken, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Uso de promociones</h1>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <DataTable<PromotionUsageSummary>
        isLoading={!usages}
        rows={usages ?? []}
        getRowKey={(row) => row.id}
        emptyTitle="Sin usos registrados todavía"
        columns={[
          {
            key: 'promotion',
            header: 'Promoción',
            render: (row) => (
              <span>
                {row.promotionName}
                {row.promotionCode && (
                  <span className="ml-2 text-xs text-neutral-400">({row.promotionCode})</span>
                )}
              </span>
            ),
          },
          { key: 'order', header: 'Pedido', render: (row) => row.orderId },
          {
            key: 'discount',
            header: 'Descuento',
            render: (row) => formatPrice(row.discountAmount),
          },
          {
            key: 'date',
            header: 'Fecha',
            render: (row) => new Date(row.createdAt).toLocaleString('es-MX'),
          },
        ]}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
