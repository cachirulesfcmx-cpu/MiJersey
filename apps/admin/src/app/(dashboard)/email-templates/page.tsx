'use client';

import type { EmailTemplate, EmailTemplateStatus } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { DataTable, FormField, Pagination } from '@mijersey/ui';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 20;
const STATUSES: EmailTemplateStatus[] = ['DRAFT', 'PUBLISHED'];
const STATUS_LABELS: Record<EmailTemplateStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicada',
};

/** Listado de plantillas transaccionales (spec 031 §6/§7) — mismo patrón que Blog/CMS Pages. */
export default function EmailTemplatesPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [templates, setTemplates] = useState<EmailTemplate[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listEmailTemplates(accessToken, {
        page,
        pageSize: PAGE_SIZE,
        ...(status ? { status: status as EmailTemplateStatus } : {}),
      });
      setTemplates(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar las plantillas.',
      );
    }
  }, [client, accessToken, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Plantillas de correo</h1>
        <Link
          href="/email-templates/new"
          className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white"
        >
          Nueva plantilla
        </Link>
      </div>

      <div className="flex gap-4 text-sm">
        <Link href="/email-layouts" className="text-brand-600 hover:underline">
          Layouts
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

      <DataTable<EmailTemplate>
        isLoading={!templates}
        rows={templates ?? []}
        getRowKey={(t) => t.id}
        emptyTitle="Sin plantillas"
        columns={[
          { key: 'name', header: 'Nombre', render: (t) => t.name },
          { key: 'key', header: 'Clave', render: (t) => t.key },
          { key: 'language', header: 'Idioma', render: (t) => t.language },
          { key: 'status', header: 'Estado', render: (t) => STATUS_LABELS[t.status] },
          { key: 'version', header: 'Versión', render: (t) => t.version },
          {
            key: 'updated',
            header: 'Actualizada',
            render: (t) => new Date(t.updatedAt).toLocaleString('es-MX'),
          },
          {
            key: 'actions',
            header: '',
            render: (t) => (
              <Link
                href={`/email-templates/${t.id}`}
                className="text-brand-600 text-sm hover:underline"
              >
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
