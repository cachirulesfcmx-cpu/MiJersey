'use client';

import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';
import { CategoryForm, type CategoryFormValues } from '../CategoryForm';
import { type FlatCategoryOption, flattenTree } from '../tree.util';

export default function NewCategoryPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialParentId = searchParams.get('parentId') ?? '';

  const [parentOptions, setParentOptions] = useState<FlatCategoryOption[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    client.getCategoryTree(accessToken).then((tree) => setParentOptions(flattenTree(tree)));
  }, [client, accessToken]);

  async function handleSubmit(values: CategoryFormValues) {
    if (!accessToken) return;

    try {
      await client.createCategory(accessToken, {
        name: values.name,
        ...(values.slug ? { slug: values.slug } : {}),
        ...(values.description ? { description: values.description } : {}),
        ...(values.image ? { image: values.image } : {}),
        ...(values.parentId ? { parentId: values.parentId } : {}),
      });
      router.push('/categories');
    } catch (err) {
      throw new Error(
        err instanceof ApiClientError ? err.message : 'No se pudo crear la categoría.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Nueva categoría</h1>
      <CategoryForm
        mode="create"
        initialValues={{
          name: '',
          slug: '',
          description: '',
          image: '',
          parentId: initialParentId,
          status: 'ACTIVE',
        }}
        parentOptions={parentOptions}
        onSubmit={handleSubmit}
        submitLabel="Crear"
      />
    </div>
  );
}
