'use client';

import type { AttributeFilterInput, FacetResult, ProductSearchSummary } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { EmptyState, Pagination, Skeleton } from '@mijersey/ui';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';
import { VolumeDiscountProgress } from '../home/VolumeDiscountProgress';
import { SearchBox } from '../search/SearchBox';
import { Reveal } from '../ui/Reveal';
import { ActiveFilters } from './ActiveFilters';
import { FilterSidebar } from './FilterSidebar';
import { ProductGrid } from './ProductGrid';
import { SortSelector } from './SortSelector';
import { useProductListingUrlState } from './use-product-listing-url-state';
import { ViewToggle } from './ViewToggle';

const PAGE_SIZE = 20;

export interface ProductListingScope {
  categoryId?: string;
  brandId?: string;
}

interface ProductListingClientProps {
  scope: ProductListingScope;
  /** Muestra un cuadro de búsqueda propio (usado por `/search`, donde no hay otra forma de cambiar el término). */
  showSearchBox?: boolean;
}

/** Motor de listado reutilizable — el mismo componente sirve para categorías, marcas y búsqueda (spec §4), parametrizado por `scope`. */
export function ProductListingClient({ scope, showSearchBox = false }: ProductListingClientProps) {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const { state, update } = useProductListingUrlState();

  const [products, setProducts] = useState<ProductSearchSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<FacetResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(state.search);

  useEffect(() => {
    setSearchInput(state.search);
  }, [state.search]);

  useEffect(() => {
    let cancelled = false;
    setProducts(null);
    client
      .searchProducts({
        filters: state.filters,
        page: state.page,
        pageSize: PAGE_SIZE,
        sortBy: state.sortBy,
        sortDir: state.sortDir,
        ...scope,
        ...(state.search ? { search: state.search } : {}),
      })
      .then((result) => {
        if (cancelled) return;
        setProducts(result.items);
        setTotal(result.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiClientError ? err.message : 'No se pudieron cargar los productos.',
        );
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    client,
    state.filters,
    state.page,
    state.sortBy,
    state.sortDir,
    state.search,
    scope.categoryId,
    scope.brandId,
  ]);

  useEffect(() => {
    let cancelled = false;
    client
      .getFilters(state.filters, { ...scope, ...(state.search ? { search: state.search } : {}) })
      .then((result) => {
        if (!cancelled) setFacets(result);
      })
      .catch(() => {
        if (!cancelled) setFacets([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, state.filters, state.search, scope.categoryId, scope.brandId]);

  function handleFilterChange(filters: AttributeFilterInput[]) {
    update({ filters, page: 1 });
  }

  const hasActiveFilters = state.filters.length > 0 || state.search.length > 0;

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      <aside className="w-full shrink-0 sm:w-64">
        {showSearchBox && (
          <div className="mb-4">
            <SearchBox
              client={client}
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={(term) => update({ search: term, page: 1 })}
            />
          </div>
        )}
        {facets === null ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <FilterSidebar
            facets={facets}
            activeFilters={state.filters}
            onChange={handleFilterChange}
          />
        )}
      </aside>

      <div className="flex flex-1 flex-col gap-4">
        {error && <p className="text-danger-600 text-sm">{error}</p>}

        <VolumeDiscountProgress variant="inline" />

        {hasActiveFilters && (
          <ActiveFilters
            facets={facets ?? []}
            activeFilters={state.filters}
            search={state.search}
            onChangeFilters={handleFilterChange}
            onRemoveSearch={() => update({ search: '', page: 1 })}
            onClearAll={() => update({ filters: [], search: '', page: 1 })}
          />
        )}

        <div className="flex items-center justify-between gap-3">
          <SortSelector
            sortBy={state.sortBy}
            sortDir={state.sortDir}
            onChange={(sortBy, sortDir) => update({ sortBy, sortDir, page: 1 })}
          />
          <ViewToggle view={state.view} onChange={(view) => update({ view })} />
        </div>

        {products === null ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <Skeleton key={index} className="skeleton-arena aspect-square w-full" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No se encontraron productos"
            description="Prueba a ajustar los filtros o la búsqueda."
          />
        ) : (
          <Reveal>
            <ProductGrid products={products} view={state.view} />
            <div className="mt-6">
              <Pagination
                page={state.page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={(page) => update({ page })}
              />
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}
