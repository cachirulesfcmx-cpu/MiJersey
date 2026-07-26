'use client';

import type { ProductType, ProductVisibility } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { type FormEvent, useState } from 'react';

export interface ProductFormValues {
  sku: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  type: ProductType;
  visibility: ProductVisibility;
}

interface ProductFormProps {
  mode: 'create' | 'edit';
  initialValues: ProductFormValues;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  submitLabel: string;
}

export function ProductForm({ mode, initialValues, onSubmit, submitLabel }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <FormField
        label="SKU"
        htmlFor="sku"
        {...(mode === 'edit' ? { hint: 'El SKU no se puede modificar.' } : {})}
      >
        <Input
          required
          disabled={mode === 'edit'}
          value={values.sku}
          onChange={(event) => set('sku', event.target.value)}
        />
      </FormField>

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

      <FormField label="Descripción corta" htmlFor="shortDescription">
        <Input
          value={values.shortDescription}
          onChange={(event) => set('shortDescription', event.target.value)}
        />
      </FormField>

      <FormField label="Descripción" htmlFor="description">
        <textarea
          id="description"
          rows={5}
          className="focus-visible:outline-brand-500 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          value={values.description}
          onChange={(event) => set('description', event.target.value)}
        />
      </FormField>

      <FormField label="Tipo" htmlFor="type">
        <select
          id="type"
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
          value={values.type}
          onChange={(event) => set('type', event.target.value as ProductType)}
        >
          <option value="PHYSICAL">Físico</option>
          <option value="DIGITAL">Digital</option>
        </select>
      </FormField>

      <FormField label="Visibilidad" htmlFor="visibility">
        <select
          id="visibility"
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
          value={values.visibility}
          onChange={(event) => set('visibility', event.target.value as ProductVisibility)}
        >
          <option value="HIDDEN">Oculto</option>
          <option value="PUBLIC">Público</option>
        </select>
      </FormField>

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
