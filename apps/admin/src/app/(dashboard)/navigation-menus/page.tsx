'use client';

import type { NavigationMenu } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { DataTable, Pagination } from '@mijersey/ui';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

const PAGE_SIZE = 20;

/** Navigation Builder (spec 028 §6): listado de menús de navegación. */
export default function NavigationMenusPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [menus, setMenus] = useState<NavigationMenu[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listNavigationMenus(accessToken, { page, pageSize: PAGE_SIZE });
      setMenus(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los menús.');
    }
  }, [client, accessToken, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Menús de navegación</h1>
        <Link
          href="/navigation-menus/new"
          className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white"
        >
          Nuevo menú
        </Link>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <DataTable<NavigationMenu>
        isLoading={!menus}
        rows={menus ?? []}
        getRowKey={(menu) => menu.id}
        emptyTitle="Sin menús"
        columns={[
          { key: 'name', header: 'Nombre', render: (menu) => menu.name },
          { key: 'location', header: 'Ubicación', render: (menu) => menu.location },
          { key: 'status', header: 'Estado', render: (menu) => menu.status },
          { key: 'items', header: 'Ítems', render: (menu) => String(menu.items.length) },
          {
            key: 'actions',
            header: '',
            render: (menu) => (
              <Link
                href={`/navigation-menus/${menu.id}`}
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
