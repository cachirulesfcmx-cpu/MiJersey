'use client';

import { useEffect, useState } from 'react';

export interface EntityOption {
  id: string;
  label: string;
}

interface EntityMultiPickerProps {
  label: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  searchOptions: (query: string) => Promise<EntityOption[]>;
}

/** Selector genérico de múltiples entidades por búsqueda (productos/categorías/colecciones/marcas) — usado por los bloques `FEATURED_*` de la Home. */
export function EntityMultiPicker({
  label,
  selectedIds,
  onChange,
  searchOptions,
}: EntityMultiPickerProps) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<EntityOption[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    const handle = setTimeout(() => {
      searchOptions(query)
        .then((opts) => {
          setOptions(opts);
          setLabels((prev) => ({
            ...prev,
            ...Object.fromEntries(opts.map((o) => [o.id, o.label])),
          }));
        })
        .catch(() => setOptions([]));
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function add(id: string) {
    if (!selectedIds.includes(id)) onChange([...selectedIds, id]);
    setQuery('');
  }

  function remove(id: string) {
    onChange(selectedIds.filter((existing) => existing !== id));
  }

  const availableOptions = options.filter((o) => !selectedIds.includes(o.id));

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar…"
        className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
      />
      {availableOptions.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-md border border-neutral-200">
          {availableOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => add(option.id)}
              className="block w-full px-3 py-1.5 text-left text-sm hover:bg-neutral-50"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => (
            <span
              key={id}
              className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700"
            >
              {labels[id] ?? `ID: ${id}`}
              <button
                type="button"
                onClick={() => remove(id)}
                className="text-neutral-400 hover:text-neutral-600"
                aria-label="Quitar"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
