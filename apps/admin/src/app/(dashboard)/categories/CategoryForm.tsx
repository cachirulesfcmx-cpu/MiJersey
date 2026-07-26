'use client';

import type { CategoryStatus } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { type FormEvent, useState } from 'react';

import type { FlatCategoryOption } from './tree.util';

export interface CategoryFormValues {
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId: string;
  status: CategoryStatus;
}

interface CategoryFormProps {
  mode: 'create' | 'edit';
  initialValues: CategoryFormValues;
  parentOptions: FlatCategoryOption[];
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  submitLabel: string;
}

export function CategoryForm({
  mode,
  initialValues,
  parentOptions,
  onSubmit,
  submitLabel,
}: CategoryFormProps) {
  const [values, setValues] = useState<CategoryFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la categoría.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <FormField label="Nombre" htmlFor="name">
        <Input required value={values.name} onChange={(event) => set('name', event.target.value)} />
      </FormField>

      <FormField
        label="Slug"
        htmlFor="slug"
        hint="Si lo dejas vacío al crear, se genera a partir del nombre."
      >
        <Input value={values.slug} onChange={(event) => set('slug', event.target.value)} />
      </FormField>

      <FormField label="Descripción" htmlFor="description">
        <Input
          value={values.description}
          onChange={(event) => set('description', event.target.value)}
        />
      </FormField>

      <FormField label="Imagen (URL)" htmlFor="image">
        <Input value={values.image} onChange={(event) => set('image', event.target.value)} />
      </FormField>

      <FormField label="Categoría padre" htmlFor="parentId">
        <select
          id="parentId"
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
          value={values.parentId}
          onChange={(event) => set('parentId', event.target.value)}
        >
          <option value="">Sin padre (raíz)</option>
          {parentOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {'—'.repeat(option.depth)} {option.name}
            </option>
          ))}
        </select>
      </FormField>

      {mode === 'edit' && (
        <FormField label="Estado" htmlFor="status">
          <select
            id="status"
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
            value={values.status}
            onChange={(event) => set('status', event.target.value as CategoryStatus)}
          >
            <option value="ACTIVE">Activa</option>
            <option value="HIDDEN">Oculta</option>
          </select>
        </FormField>
      )}

      {error && (
        <p role="alert" className="text-danger-600 text-sm">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
