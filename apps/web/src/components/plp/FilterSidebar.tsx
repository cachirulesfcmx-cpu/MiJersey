'use client';

import type { AttributeFilterInput, FacetResult } from '@mijersey/sdk';

function isValueBased(type: string): boolean {
  return type === 'LIST' || type === 'COLOR';
}

export function FilterSidebar({
  facets,
  activeFilters,
  onChange,
}: {
  facets: FacetResult[];
  activeFilters: AttributeFilterInput[];
  onChange: (filters: AttributeFilterInput[]) => void;
}) {
  if (facets.length === 0) return null;

  function toggle(attributeId: string, type: string, valueId: string | null, value: string) {
    const existing = activeFilters.find((f) => f.attributeId === attributeId);
    const valueBased = isValueBased(type);
    const key = valueBased ? (valueId ?? '') : value;
    const currentList = valueBased ? (existing?.valueIds ?? []) : (existing?.customValues ?? []);
    const isSelected = currentList.includes(key);
    const nextList = isSelected ? currentList.filter((v) => v !== key) : [...currentList, key];

    const withoutThis = activeFilters.filter((f) => f.attributeId !== attributeId);
    if (nextList.length === 0) {
      onChange(withoutThis);
      return;
    }
    onChange([
      ...withoutThis,
      { attributeId, ...(valueBased ? { valueIds: nextList } : { customValues: nextList }) },
    ]);
  }

  return (
    <div className="flex flex-col gap-6">
      {facets.map((facet) => {
        const existing = activeFilters.find((f) => f.attributeId === facet.attributeId);
        const valueBased = isValueBased(facet.type);
        const selected = valueBased ? (existing?.valueIds ?? []) : (existing?.customValues ?? []);

        return (
          <fieldset key={facet.attributeId} className="flex flex-col gap-2">
            <legend className="label-arena mb-1">{facet.name}</legend>
            {facet.values.map((facetValue) => {
              const key = valueBased ? (facetValue.valueId ?? '') : facetValue.value;
              const checked = selected.includes(key);
              return (
                <label
                  key={key}
                  className="hover:text-arena-900 flex cursor-pointer items-center gap-2 text-sm text-neutral-600 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    className="accent-pop-500"
                    onChange={() =>
                      toggle(facet.attributeId, facet.type, facetValue.valueId, facetValue.value)
                    }
                  />
                  {facetValue.label} <span className="text-neutral-400">({facetValue.count})</span>
                </label>
              );
            })}
          </fieldset>
        );
      })}
    </div>
  );
}
