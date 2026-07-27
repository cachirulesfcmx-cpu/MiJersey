'use client';

import type { AttributeStatus, AttributeType, AttributeValueInput } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { type FormEvent, useState } from 'react';

const TYPE_LABELS: Record<AttributeType, string> = {
  TEXT: 'Texto',
  NUMBER: 'Número',
  BOOLEAN: 'Booleano',
  DATE: 'Fecha',
  LIST: 'Lista',
  COLOR: 'Color',
  MEASUREMENT: 'Medida',
};

const VALUE_BASED_TYPES: AttributeType[] = ['LIST', 'COLOR'];

export interface AttributeFormValues {
  code: string;
  name: string;
  type: AttributeType;
  isFilterable: boolean;
  isComparable: boolean;
  isRequired: boolean;
  status: AttributeStatus;
  values: AttributeValueInput[];
}

interface AttributeFormProps {
  mode: 'create' | 'edit';
  initialValues: AttributeFormValues;
  onSubmit: (values: AttributeFormValues) => Promise<void>;
  submitLabel: string;
}

export function AttributeForm({ mode, initialValues, onSubmit, submitLabel }: AttributeFormProps) {
  const [values, setValues] = useState<AttributeFormValues>(initialValues);
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof AttributeFormValues>(key: K, value: AttributeFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function updateValueRow(index: number, patch: Partial<AttributeValueInput>) {
    setValues((prev) => ({
      ...prev,
      values: prev.values.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  }

  function moveValueRow(index: number, direction: -1 | 1) {
    setValues((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.values.length) return prev;
      const next = [...prev.values];
      const current = next[index];
      const swapped = next[target];
      if (!current || !swapped) return prev;
      next[index] = swapped;
      next[target] = current;
      return { ...prev, values: next };
    });
  }

  function removeValueRow(index: number) {
    setValues((prev) => ({ ...prev, values: prev.values.filter((_, i) => i !== index) }));
  }

  function addValueRow() {
    if (!newValue.trim() || !newLabel.trim()) return;
    setValues((prev) => ({
      ...prev,
      values: [...prev.values, { value: newValue.trim(), label: newLabel.trim() }],
    }));
    setNewValue('');
    setNewLabel('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el atributo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const showValues = VALUE_BASED_TYPES.includes(values.type);

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <FormField
        label="Código"
        htmlFor="code"
        hint={
          mode === 'edit'
            ? 'El código no se puede modificar.'
            : 'Si lo dejas vacío, se genera a partir del nombre.'
        }
      >
        <Input
          disabled={mode === 'edit'}
          value={values.code}
          onChange={(event) => set('code', event.target.value)}
        />
      </FormField>

      <FormField label="Nombre" htmlFor="name">
        <Input required value={values.name} onChange={(event) => set('name', event.target.value)} />
      </FormField>

      <FormField label="Tipo" htmlFor="type">
        <select
          id="type"
          disabled={mode === 'edit'}
          className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-50 disabled:text-neutral-400"
          value={values.type}
          onChange={(event) => set('type', event.target.value as AttributeType)}
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </FormField>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-neutral-900">
          <input
            type="checkbox"
            checked={values.isFilterable}
            onChange={(event) => set('isFilterable', event.target.checked)}
          />
          Filtrable (aparece en la búsqueda facetada)
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-900">
          <input
            type="checkbox"
            checked={values.isComparable}
            onChange={(event) => set('isComparable', event.target.checked)}
          />
          Comparable
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-900">
          <input
            type="checkbox"
            checked={values.isRequired}
            onChange={(event) => set('isRequired', event.target.checked)}
          />
          Obligatorio
        </label>
      </div>

      {mode === 'edit' && (
        <FormField label="Estado" htmlFor="status">
          <select
            id="status"
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
            value={values.status}
            onChange={(event) => set('status', event.target.value as AttributeStatus)}
          >
            <option value="ACTIVE">Activo</option>
            <option value="ARCHIVED">Archivado</option>
          </select>
        </FormField>
      )}

      {showValues && (
        <div className="flex flex-col gap-2 border-t border-neutral-200 pt-4">
          <span className="text-sm font-medium text-neutral-900">Valores</span>

          {values.values.map((row, index) => (
            <div key={`${row.value}-${index}`} className="flex items-center gap-2">
              <Input
                value={row.value}
                placeholder="Valor (p. ej. red)"
                onChange={(event) => updateValueRow(index, { value: event.target.value })}
                className="w-32"
              />
              <Input
                value={row.label}
                placeholder="Etiqueta (p. ej. Rojo)"
                onChange={(event) => updateValueRow(index, { label: event.target.value })}
                className="flex-1"
              />
              <button
                type="button"
                disabled={index === 0}
                onClick={() => moveValueRow(index, -1)}
                className="text-sm text-neutral-500 disabled:text-neutral-200"
                aria-label="Subir"
              >
                ▲
              </button>
              <button
                type="button"
                disabled={index === values.values.length - 1}
                onClick={() => moveValueRow(index, 1)}
                className="text-sm text-neutral-500 disabled:text-neutral-200"
                aria-label="Bajar"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => removeValueRow(index)}
                className="text-danger-600 text-sm hover:underline"
              >
                Eliminar
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2 border-t border-neutral-100 pt-2">
            <Input
              value={newValue}
              placeholder="Valor (p. ej. red)"
              onChange={(event) => setNewValue(event.target.value)}
              className="w-32"
            />
            <Input
              value={newLabel}
              placeholder="Etiqueta (p. ej. Rojo)"
              onChange={(event) => setNewLabel(event.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              disabled={!newValue.trim() || !newLabel.trim()}
              onClick={addValueRow}
            >
              Agregar
            </Button>
          </div>
        </div>
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
