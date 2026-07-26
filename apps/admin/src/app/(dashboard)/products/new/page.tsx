'use client';

import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';
import { ProductForm, type ProductFormValues } from '../ProductForm';

const EMPTY_VALUES: ProductFormValues = {
  sku: '',
  slug: '',
  name: '',
  shortDescription: '',
  description: '',
  type: 'PHYSICAL',
  visibility: 'HIDDEN',
};

export default function NewProductPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const router = useRouter();

  async function handleSubmit(values: ProductFormValues) {
    if (!accessToken) return;

    try {
      await client.createProduct(accessToken, {
        sku: values.sku,
        name: values.name,
        ...(values.slug ? { slug: values.slug } : {}),
        ...(values.shortDescription ? { shortDescription: values.shortDescription } : {}),
        ...(values.description ? { description: values.description } : {}),
        type: values.type,
        visibility: values.visibility,
      });
      router.push('/products');
    } catch (err) {
      throw new Error(
        err instanceof ApiClientError ? err.message : 'No se pudo crear el producto.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Nuevo producto</h1>
      <ProductForm
        mode="create"
        initialValues={EMPTY_VALUES}
        onSubmit={handleSubmit}
        submitLabel="Crear"
      />
    </div>
  );
}
