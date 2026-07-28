'use client';

import type { BrandStatus } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useState } from 'react';

import { env } from '../../../config/env';
import { MediaPicker } from './MediaPicker';

export interface BrandFormValues {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  website: string;
  country: string;
  logoMediaId: string | null;
  coverMediaId: string | null;
  status: BrandStatus;
}

interface BrandFormProps {
  mode: 'create' | 'edit';
  initialValues: BrandFormValues;
  accessToken: string;
  onSubmit: (values: BrandFormValues) => Promise<void>;
  submitLabel: string;
}

export function BrandForm({
  mode,
  initialValues,
  accessToken,
  onSubmit,
  submitLabel,
}: BrandFormProps) {
  const [values, setValues] = useState<BrandFormValues>(initialValues);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });

  function set<K extends keyof BrandFormValues>(key: K, value: BrandFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la marca.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="flex max-w-2xl flex-col gap-4" onSubmit={(event) => void handleSubmit(event)}>
      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <FormField label="Nombre" htmlFor="name" required>
        <Input
          id="name"
          value={values.name}
          onChange={(event) => set('name', event.target.value)}
          required
        />
      </FormField>

      <FormField
        label="Slug"
        htmlFor="slug"
        {...(mode === 'create' ? { hint: 'Se genera del nombre si se deja en blanco.' } : {})}
      >
        <Input
          id="slug"
          value={values.slug}
          onChange={(event) => set('slug', event.target.value)}
        />
      </FormField>

      <FormField label="Descripción corta" htmlFor="shortDescription">
        <Input
          id="shortDescription"
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

      <FormField label="Sitio web" htmlFor="website">
        <Input
          id="website"
          type="url"
          placeholder="https://"
          value={values.website}
          onChange={(event) => set('website', event.target.value)}
        />
      </FormField>

      <FormField label="País" htmlFor="country">
        <Input
          id="country"
          value={values.country}
          onChange={(event) => set('country', event.target.value)}
        />
      </FormField>

      <MediaPicker
        label="Logo"
        accessToken={accessToken}
        client={client}
        value={values.logoMediaId}
        onChange={(mediaId) => set('logoMediaId', mediaId)}
      />

      <MediaPicker
        label="Imagen destacada (cover)"
        accessToken={accessToken}
        client={client}
        value={values.coverMediaId}
        onChange={(mediaId) => set('coverMediaId', mediaId)}
      />

      {mode === 'edit' && (
        <FormField label="Estado" htmlFor="status">
          <select
            id="status"
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
            value={values.status}
            onChange={(event) => set('status', event.target.value as BrandStatus)}
          >
            <option value="ACTIVE">Activo</option>
            <option value="ARCHIVED">Archivado</option>
          </select>
        </FormField>
      )}

      <Button type="submit" isLoading={isSaving} className="self-start">
        {submitLabel}
      </Button>
    </form>
  );
}
