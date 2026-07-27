'use client';

import type { WarehouseStatus } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { type FormEvent, useState } from 'react';

export interface WarehouseFormValues {
  code: string;
  name: string;
  status: WarehouseStatus;
}

interface WarehouseFormProps {
  mode: 'create' | 'edit';
  initialValues: WarehouseFormValues;
  onSubmit: (values: WarehouseFormValues) => Promise<void>;
  submitLabel: string;
}

export function WarehouseForm({ mode, initialValues, onSubmit, submitLabel }: WarehouseFormProps) {
  const [values, setValues] = useState<WarehouseFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof WarehouseFormValues>(key: K, value: WarehouseFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el almacén.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <FormField
        label="Código"
        htmlFor="code"
        {...(mode === 'edit' ? { hint: 'El código no se puede modificar.' } : {})}
      >
        <Input
          required
          disabled={mode === 'edit'}
          value={values.code}
          onChange={(event) => set('code', event.target.value)}
        />
      </FormField>

      <FormField label="Nombre" htmlFor="name">
        <Input required value={values.name} onChange={(event) => set('name', event.target.value)} />
      </FormField>

      {mode === 'edit' && (
        <FormField label="Estado" htmlFor="status">
          <select
            id="status"
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
            value={values.status}
            onChange={(event) => set('status', event.target.value as WarehouseStatus)}
          >
            <option value="ACTIVE">Activo</option>
            <option value="ARCHIVED">Archivado</option>
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
