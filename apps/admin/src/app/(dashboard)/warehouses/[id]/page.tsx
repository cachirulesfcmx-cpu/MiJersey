'use client';

import type { Warehouse } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';
import { WarehouseForm, type WarehouseFormValues } from '../WarehouseForm';

function toFormValues(warehouse: Warehouse): WarehouseFormValues {
  return { code: warehouse.code, name: warehouse.name, status: warehouse.status };
}

export default function EditWarehousePage({ params }: { params: { id: string } }) {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const router = useRouter();

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    client
      .getWarehouse(accessToken, params.id)
      .then(setWarehouse)
      .catch((err: unknown) => {
        setLoadError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el almacén.');
      });
  }, [client, accessToken, params.id]);

  async function handleSubmit(values: WarehouseFormValues) {
    if (!accessToken) return;

    try {
      await client.updateWarehouse(accessToken, params.id, {
        name: values.name,
        status: values.status,
      });
      router.push('/warehouses');
    } catch (err) {
      throw new Error(
        err instanceof ApiClientError ? err.message : 'No se pudo guardar el almacén.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Editar almacén</h1>

      {loadError && <p className="text-danger-600 text-sm">{loadError}</p>}

      {warehouse && (
        <WarehouseForm
          mode="edit"
          initialValues={toFormValues(warehouse)}
          onSubmit={handleSubmit}
          submitLabel="Guardar cambios"
        />
      )}
    </div>
  );
}
