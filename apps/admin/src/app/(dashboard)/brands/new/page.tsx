'use client';

import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';
import { BrandForm, type BrandFormValues } from '../BrandForm';

const EMPTY_VALUES: BrandFormValues = {
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  website: '',
  country: '',
  logoMediaId: null,
  coverMediaId: null,
  status: 'ACTIVE',
};

export default function NewBrandPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const router = useRouter();

  async function handleSubmit(values: BrandFormValues) {
    if (!accessToken) return;

    try {
      await client.createBrand(accessToken, {
        name: values.name,
        ...(values.slug ? { slug: values.slug } : {}),
        ...(values.shortDescription ? { shortDescription: values.shortDescription } : {}),
        ...(values.description ? { description: values.description } : {}),
        ...(values.website ? { website: values.website } : {}),
        ...(values.country ? { country: values.country } : {}),
        ...(values.logoMediaId ? { logoMediaId: values.logoMediaId } : {}),
        ...(values.coverMediaId ? { coverMediaId: values.coverMediaId } : {}),
      });
      router.push('/brands');
    } catch (err) {
      throw new Error(err instanceof ApiClientError ? err.message : 'No se pudo crear la marca.');
    }
  }

  if (!accessToken) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Nueva marca</h1>
      <BrandForm
        mode="create"
        initialValues={EMPTY_VALUES}
        accessToken={accessToken}
        onSubmit={handleSubmit}
        submitLabel="Crear"
      />
    </div>
  );
}
