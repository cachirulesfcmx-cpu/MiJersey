'use client';

import type { Attribute } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';
import { AttributeForm, type AttributeFormValues } from '../AttributeForm';

function toFormValues(attribute: Attribute): AttributeFormValues {
  return {
    code: attribute.code,
    name: attribute.name,
    type: attribute.type,
    isFilterable: attribute.isFilterable,
    isComparable: attribute.isComparable,
    isRequired: attribute.isRequired,
    status: attribute.status,
    values: attribute.values.map((value) => ({ value: value.value, label: value.label })),
  };
}

export default function EditAttributePage({ params }: { params: { id: string } }) {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const router = useRouter();

  const [attribute, setAttribute] = useState<Attribute | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    client
      .getAttribute(accessToken, params.id)
      .then(setAttribute)
      .catch((err: unknown) => {
        setLoadError(
          err instanceof ApiClientError ? err.message : 'No se pudo cargar el atributo.',
        );
      });
  }, [client, accessToken, params.id]);

  async function handleSubmit(values: AttributeFormValues) {
    if (!accessToken) return;

    try {
      await client.updateAttribute(accessToken, params.id, {
        name: values.name,
        isFilterable: values.isFilterable,
        isComparable: values.isComparable,
        isRequired: values.isRequired,
        status: values.status,
        values: values.values,
      });
      router.push('/attributes');
    } catch (err) {
      throw new Error(
        err instanceof ApiClientError ? err.message : 'No se pudo guardar el atributo.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Editar atributo</h1>

      {loadError && <p className="text-danger-600 text-sm">{loadError}</p>}

      {attribute && (
        <AttributeForm
          mode="edit"
          initialValues={toFormValues(attribute)}
          onSubmit={handleSubmit}
          submitLabel="Guardar cambios"
        />
      )}
    </div>
  );
}
