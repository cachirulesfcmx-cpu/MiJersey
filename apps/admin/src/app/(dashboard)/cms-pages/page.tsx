'use client';

import type { Page, PageStatus } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { DataTable, FormField, Pagination } from '@mijersey/ui';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 20;
const STATUSES: PageStatus[] = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'];

const STATUS_LABELS: Record<PageStatus, string> = {
  DRAFT: 'Borrador',
  SCHEDULED: 'Programada',
  PUBLISHED: 'Publicada',
  ARCHIVED: 'Archivada',
};

/** Page Builder (spec 026 §6): listado de páginas CMS con filtro de estado. */
export default function CmsPagesPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [pages, setPages] = useState<Page[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listPages(accessToken, {
        page,
        pageSize: PAGE_SIZE,
        ...(status ? { status: status as PageStatus } : {}),
      });
      setPages(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar las páginas.');
    }
  }, [client, accessToken, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Páginas</h1>
        <Link
          href="/cms-pages/new"
          className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white"
        >
          Nueva página
        </Link>
      </div>

      <FormField label="Estado" htmlFor="status-filter">
        <select
          id="status-filter"
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </FormField>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <DataTable<Page>
        isLoading={!pages}
        rows={pages ?? []}
        getRowKey={(p) => p.id}
        emptyTitle="Sin páginas"
        columns={[
          { key: 'title', header: 'Título', render: (p) => p.title },
          { key: 'slug', header: 'Slug', render: (p) => `/pages/${p.slug}` },
          { key: 'status', header: 'Estado', render: (p) => STATUS_LABELS[p.status] },
          { key: 'template', header: 'Plantilla', render: (p) => p.template },
          {
            key: 'updated',
            header: 'Actualizada',
            render: (p) => new Date(p.updatedAt).toLocaleString('es-MX'),
          },
          {
            key: 'actions',
            header: '',
            render: (p) => (
              <Link href={`/cms-pages/${p.id}`} className="text-brand-600 text-sm hover:underline">
                Editar
              </Link>
            ),
          },
        ]}
      />

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
