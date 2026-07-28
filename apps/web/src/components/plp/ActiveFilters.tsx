'use client';

import type { AttributeFilterInput, FacetResult } from '@mijersey/sdk';

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

export function ActiveFilters({
  facets,
  activeFilters,
  search,
  onChangeFilters,
  onRemoveSearch,
  onClearAll,
}: {
  facets: FacetResult[];
  activeFilters: AttributeFilterInput[];
  search: string;
  onChangeFilters: (filters: AttributeFilterInput[]) => void;
  onRemoveSearch: () => void;
  onClearAll: () => void;
}) {
  const chips: Chip[] = [];

  if (search) {
    chips.push({ key: 'search', label: `Búsqueda: "${search}"`, onRemove: onRemoveSearch });
  }

  for (const filter of activeFilters) {
    const facet = facets.find((f) => f.attributeId === filter.attributeId);
    const values = filter.valueIds ?? filter.customValues ?? [];
    for (const value of values) {
      const facetValue = facet?.values.find((v) => (v.valueId ?? v.value) === value);
      const label = `${facet?.name ?? 'Filtro'}: ${facetValue?.label ?? value}`;
      chips.push({
        key: `${filter.attributeId}-${value}`,
        label,
        onRemove: () => {
          const nextValues = values.filter((v) => v !== value);
          const withoutThis = activeFilters.filter((f) => f.attributeId !== filter.attributeId);
          if (nextValues.length === 0) {
            onChangeFilters(withoutThis);
          } else {
            onChangeFilters([
              ...withoutThis,
              {
                attributeId: filter.attributeId,
                ...(filter.valueIds ? { valueIds: nextValues } : { customValues: nextValues }),
              },
            ]);
          }
        },
      });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="text-neutral-400 hover:text-neutral-600"
            aria-label="Quitar filtro"
          >
            ×
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs text-neutral-500 hover:underline"
      >
        Limpiar todo
      </button>
    </div>
  );
}
