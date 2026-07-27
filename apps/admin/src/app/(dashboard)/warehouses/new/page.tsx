'use client';

import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';
import { WarehouseForm, type WarehouseFormValues } from '../WarehouseForm';

const EMPTY_VALUES: WarehouseFormValues = { code: '', name: '', status: 'ACTIVE' };

export default function NewWarehousePage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const router = useRouter();

  async function handleSubmit(values: WarehouseFormValues) {
    if (!accessToken) return;

    try {
      await client.createWarehouse(accessToken, { code: values.code, name: values.name });
      router.push('/warehouses');
    } catch (err) {
      throw new Error(err instanceof ApiClientError ? err.message : 'No se pudo crear el almacén.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Nuevo almacén</h1>
      <WarehouseForm
        mode="create"
        initialValues={EMPTY_VALUES}
        onSubmit={handleSubmit}
        submitLabel="Crear"
      />
    </div>
  );
}
