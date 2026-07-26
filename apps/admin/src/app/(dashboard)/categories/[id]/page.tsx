'use client';

import type { Category, CategoryTreeNode } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';
import { CategoryForm, type CategoryFormValues } from '../CategoryForm';
import { collectSubtreeIds, type FlatCategoryOption, flattenTree } from '../tree.util';

function toFormValues(category: Category): CategoryFormValues {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? '',
    image: category.image ?? '',
    parentId: category.parentId ?? '',
    status: category.status,
  };
}

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const router = useRouter();

  const [category, setCategory] = useState<Category | null>(null);
  const [parentOptions, setParentOptions] = useState<FlatCategoryOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    Promise.all([client.getCategory(accessToken, params.id), client.getCategoryTree(accessToken)])
      .then(([loadedCategory, tree]: [Category, CategoryTreeNode[]]) => {
        setCategory(loadedCategory);
        const excluded = collectSubtreeIds(tree, params.id);
        setParentOptions(flattenTree(tree).filter((option) => !excluded.has(option.id)));
      })
      .catch((err: unknown) => {
        setLoadError(
          err instanceof ApiClientError ? err.message : 'No se pudo cargar la categoría.',
        );
      });
  }, [client, accessToken, params.id]);

  async function handleSubmit(values: CategoryFormValues) {
    if (!accessToken || !category) return;

    try {
      await client.updateCategory(accessToken, params.id, {
        name: values.name,
        slug: values.slug,
        description: values.description,
        image: values.image,
        status: values.status,
      });

      const newParentId = values.parentId || null;
      if (newParentId !== category.parentId) {
        await client.moveCategory(accessToken, params.id, newParentId);
      }

      router.push('/categories');
    } catch (err) {
      throw new Error(
        err instanceof ApiClientError ? err.message : 'No se pudo guardar la categoría.',
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Editar categoría</h1>

      {loadError && <p className="text-danger-600 text-sm">{loadError}</p>}

      {category && (
        <CategoryForm
          mode="edit"
          initialValues={toFormValues(category)}
          parentOptions={parentOptions}
          onSubmit={handleSubmit}
          submitLabel="Guardar cambios"
        />
      )}
    </div>
  );
}
