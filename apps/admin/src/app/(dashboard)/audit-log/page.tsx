'use client';

import type { AuditLogEntry } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { DataTable, FormField, Input, Pagination } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 20;

export default function AuditLogPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [entries, setEntries] = useState<AuditLogEntry[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;

    try {
      const result = await client.queryAuditLog(accessToken, {
        page,
        pageSize: PAGE_SIZE,
        ...(actionFilter ? { action: actionFilter } : {}),
      });
      setEntries(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar la auditoría.');
    }
  }, [client, accessToken, page, actionFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Auditoría</h1>

      <FormField label="Filtrar por acción" htmlFor="action-filter">
        <Input
          placeholder="p. ej. auth.login.failed"
          value={actionFilter}
          onChange={(event) => {
            setPage(1);
            setActionFilter(event.target.value);
          }}
        />
      </FormField>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <DataTable<AuditLogEntry>
        isLoading={!entries}
        rows={entries ?? []}
        getRowKey={(entry) => entry.id}
        emptyTitle="Sin registros"
        columns={[
          { key: 'action', header: 'Acción', render: (entry) => entry.action },
          { key: 'ip', header: 'IP', render: (entry) => entry.ipAddress ?? '—' },
          {
            key: 'date',
            header: 'Fecha',
            render: (entry) => new Date(entry.createdAt).toLocaleString('es-MX'),
          },
        ]}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
