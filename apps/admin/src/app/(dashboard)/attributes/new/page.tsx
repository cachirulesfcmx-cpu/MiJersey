'use client';

import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';
import { AttributeForm, type AttributeFormValues } from '../AttributeForm';

const EMPTY_VALUES: AttributeFormValues = {
  code: '',
  name: '',
  type: 'TEXT',
  isFilterable: false,
  isComparable: false,
  isRequired: false,
  status: 'ACTIVE',
  values: [],
};

export default function NewAttributePage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const router = useRouter();

  async function handleSubmit(values: AttributeFormValues) {
    if (!accessToken) return;

    try {
      await client.createAttribute(accessToken, {
        ...(values.code ? { code: values.code } : {}),
        name: values.name,
        type: values.type,
        isFilterable: values.isFilterable,
        isComparable: values.isComparable,
        isRequired: values.isRequired,
        values: values.values,
      });
      router.push('/attributes');
    } catch (err) {
      throw new Error(
        err instanceof ApiClientError ? err.message : 'No se pudo crear el atributo.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Nuevo atributo</h1>
      <AttributeForm
        mode="create"
        initialValues={EMPTY_VALUES}
        onSubmit={handleSubmit}
        submitLabel="Crear"
      />
    </div>
  );
}
