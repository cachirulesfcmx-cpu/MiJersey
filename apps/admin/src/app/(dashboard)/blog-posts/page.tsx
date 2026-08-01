'use client';

import type { Post, PostStatus } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { DataTable, FormField, Pagination } from '@mijersey/ui';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 20;
const STATUSES: PostStatus[] = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'];

const STATUS_LABELS: Record<PostStatus, string> = {
  DRAFT: 'Borrador',
  SCHEDULED: 'Programado',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
};

/** Listado de artículos del blog (spec 027 §6/§7), con filtro de estado — mismo patrón que Page Builder (026). */
export default function BlogPostsPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [posts, setPosts] = useState<Post[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listPosts(accessToken, {
        page,
        pageSize: PAGE_SIZE,
        ...(status ? { status: status as PostStatus } : {}),
      });
      setPosts(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar los artículos.',
      );
    }
  }, [client, accessToken, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Blog</h1>
        <Link
          href="/blog-posts/new"
          className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white"
        >
          Nuevo artículo
        </Link>
      </div>

      <div className="flex gap-4 text-sm">
        <Link href="/blog-categories" className="text-brand-600 hover:underline">
          Categorías
        </Link>
        <Link href="/blog-tags" className="text-brand-600 hover:underline">
          Etiquetas
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

      <DataTable<Post>
        isLoading={!posts}
        rows={posts ?? []}
        getRowKey={(p) => p.id}
        emptyTitle="Sin artículos"
        columns={[
          { key: 'title', header: 'Título', render: (p) => p.title },
          { key: 'slug', header: 'Slug', render: (p) => `/blog/${p.slug}` },
          { key: 'status', header: 'Estado', render: (p) => STATUS_LABELS[p.status] },
          {
            key: 'author',
            header: 'Autor',
            render: (p) => `${p.author.firstName} ${p.author.lastName}`,
          },
          {
            key: 'updated',
            header: 'Actualizado',
            render: (p) => new Date(p.updatedAt).toLocaleString('es-MX'),
          },
          {
            key: 'actions',
            header: '',
            render: (p) => (
              <Link href={`/blog-posts/${p.id}`} className="text-brand-600 text-sm hover:underline">
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
