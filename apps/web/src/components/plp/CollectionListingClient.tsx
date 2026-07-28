'use client';

import type { CollectionProductSummary } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { EmptyState, Pagination, Skeleton } from '@mijersey/ui';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';
import { ProductGrid } from './ProductGrid';
import { useProductListingUrlState } from './use-product-listing-url-state';
import { ViewToggle } from './ViewToggle';

const PAGE_SIZE = 20;

/**
 * Listado de una colección: reutiliza `ProductGrid`/`Pagination`/`ViewToggle`, pero no `FilterSidebar`/`SortSelector` —
 * las colecciones (MANUAL o SMART) no pasan por el motor de facetas de Attributes (ver docs/product-listing.md).
 */
export function CollectionListingClient({ slug }: { slug: string }) {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const { state, update } = useProductListingUrlState();

  const [products, setProducts] = useState<CollectionProductSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProducts(null);
    client
      .getPublicCollection(slug, { page: state.page, pageSize: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setProducts(result.products);
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
  }, [client, slug, state.page]);

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <div className="flex justify-end">
        <ViewToggle view={state.view} onChange={(view) => update({ view })} />
      </div>

      {products === null ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <Skeleton key={index} className="aspect-square w-full" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          title="Esta colección todavía no tiene productos"
          description="Vuelve pronto para ver las novedades."
        />
      ) : (
        <>
          <ProductGrid products={products} view={state.view} />
          <Pagination
            page={state.page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={(page) => update({ page })}
          />
        </>
      )}
    </div>
  );
}
