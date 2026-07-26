'use client';

import type { Product } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';
import { ProductForm, type ProductFormValues } from '../ProductForm';

function toFormValues(product: Product): ProductFormValues {
  return {
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription ?? '',
    description: product.description ?? '',
    type: product.type,
    visibility: product.visibility,
  };
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    client
      .getProduct(accessToken, params.id)
      .then(setProduct)
      .catch((err: unknown) => {
        setLoadError(
          err instanceof ApiClientError ? err.message : 'No se pudo cargar el producto.',
        );
      });
  }, [client, accessToken, params.id]);

  async function handleSubmit(values: ProductFormValues) {
    if (!accessToken) return;

    try {
      await client.updateProduct(accessToken, params.id, {
        name: values.name,
        slug: values.slug,
        shortDescription: values.shortDescription,
        description: values.description,
        type: values.type,
        visibility: values.visibility,
      });
      router.push('/products');
    } catch (err) {
      throw new Error(
        err instanceof ApiClientError ? err.message : 'No se pudo guardar el producto.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Editar producto</h1>

      {loadError && <p className="text-danger-600 text-sm">{loadError}</p>}

      {product && (
        <ProductForm
          mode="edit"
          initialValues={toFormValues(product)}
          onSubmit={handleSubmit}
          submitLabel="Guardar cambios"
        />
      )}
    </div>
  );
}
