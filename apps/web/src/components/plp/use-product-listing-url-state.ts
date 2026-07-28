'use client';

import type { AttributeFilterInput } from '@mijersey/sdk';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export interface ProductListingUrlState {
  page: number;
  sortBy: 'name' | 'createdAt';
  sortDir: 'asc' | 'desc';
  search: string;
  view: 'grid' | 'list';
  filters: AttributeFilterInput[];
}

const DEFAULTS: ProductListingUrlState = {
  page: 1,
  sortBy: 'name',
  sortDir: 'asc',
  search: '',
  view: 'grid',
  filters: [],
};

function parseFilters(raw: string | null): AttributeFilterInput[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AttributeFilterInput[]) : [];
  } catch {
    return [];
  }
}

/** Sincroniza el estado del listado (página, orden, búsqueda, vista, filtros) con la URL — spec §3 "URL compartible con filtros persistentes". */
export function useProductListingUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useMemo<ProductListingUrlState>(
    () => ({
      page: Number(searchParams.get('page')) || DEFAULTS.page,
      sortBy: (searchParams.get('sortBy') as ProductListingUrlState['sortBy']) || DEFAULTS.sortBy,
      sortDir:
        (searchParams.get('sortDir') as ProductListingUrlState['sortDir']) || DEFAULTS.sortDir,
      search: searchParams.get('q') ?? DEFAULTS.search,
      view: (searchParams.get('view') as ProductListingUrlState['view']) || DEFAULTS.view,
      filters: parseFilters(searchParams.get('filters')),
    }),
    [searchParams],
  );

  const update = useCallback(
    (patch: Partial<ProductListingUrlState>) => {
      const next = { ...state, ...patch };
      const params = new URLSearchParams();
      if (next.page > 1) params.set('page', String(next.page));
      if (next.sortBy !== DEFAULTS.sortBy) params.set('sortBy', next.sortBy);
      if (next.sortDir !== DEFAULTS.sortDir) params.set('sortDir', next.sortDir);
      if (next.search) params.set('q', next.search);
      if (next.view !== DEFAULTS.view) params.set('view', next.view);
      if (next.filters.length > 0) params.set('filters', JSON.stringify(next.filters));

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [state, router, pathname],
  );

  return { state, update };
}
