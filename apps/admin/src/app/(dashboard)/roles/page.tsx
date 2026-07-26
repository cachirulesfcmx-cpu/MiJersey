'use client';

import type { RoleSummary } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { DataTable } from '@mijersey/ui';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

export default function RolesPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [roles, setRoles] = useState<RoleSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    client
      .listRoles(accessToken)
      .then(setRoles)
      .catch((err: unknown) => {
        setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los roles.');
      });
  }, [client, accessToken]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Roles y permisos</h1>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <DataTable<RoleSummary>
        isLoading={!roles}
        rows={roles ?? []}
        getRowKey={(role) => role.name}
        emptyTitle="Sin roles configurados"
        columns={[
          { key: 'name', header: 'Rol', render: (role) => role.name },
          {
            key: 'permissions',
            header: 'Permisos',
            render: (role) => (role.permissions.length > 0 ? role.permissions.join(', ') : '—'),
          },
        ]}
      />
    </div>
  );
}
