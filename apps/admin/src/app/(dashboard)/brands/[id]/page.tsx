'use client';

import type { Brand } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';
import { BrandForm, type BrandFormValues } from '../BrandForm';
import { BrandProductsPanel } from '../BrandProductsPanel';

function toFormValues(brand: Brand): BrandFormValues {
  return {
    name: brand.name,
    slug: brand.slug,
    shortDescription: brand.shortDescription ?? '',
    description: brand.description ?? '',
    website: brand.website ?? '',
    country: brand.country ?? '',
    logoMediaId: brand.logoMediaId,
    coverMediaId: brand.coverMediaId,
    status: brand.status,
  };
}

export default function EditBrandPage({ params }: { params: { id: string } }) {
  const { accessToken, hasPermission } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const router = useRouter();
  const canManage = hasPermission('catalog:manage');

  const [brand, setBrand] = useState<Brand | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    client
      .getBrand(accessToken, params.id)
      .then(setBrand)
      .catch((err: unknown) => {
        setLoadError(err instanceof ApiClientError ? err.message : 'No se pudo cargar la marca.');
      });
  }, [client, accessToken, params.id]);

  async function handleSubmit(values: BrandFormValues) {
    if (!accessToken) return;

    try {
      await client.updateBrand(accessToken, params.id, {
        name: values.name,
        slug: values.slug,
        shortDescription: values.shortDescription || null,
        description: values.description || null,
        website: values.website || null,
        country: values.country || null,
        logoMediaId: values.logoMediaId,
        coverMediaId: values.coverMediaId,
        status: values.status,
      });
      router.push('/brands');
    } catch (err) {
      throw new Error(err instanceof ApiClientError ? err.message : 'No se pudo guardar la marca.');
    }
  }

  if (!accessToken) return null;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Editar marca</h1>

      {loadError && <p className="text-danger-600 text-sm">{loadError}</p>}

      {brand && (
        <>
          <BrandForm
            mode="edit"
            initialValues={toFormValues(brand)}
            accessToken={accessToken}
            onSubmit={handleSubmit}
            submitLabel="Guardar cambios"
          />

          <BrandProductsPanel
            brandId={brand.id}
            accessToken={accessToken}
            client={client}
            canManage={canManage}
          />
        </>
      )}
    </div>
  );
}
