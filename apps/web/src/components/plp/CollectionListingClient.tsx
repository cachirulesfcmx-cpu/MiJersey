'use client';

import type { CollectionProductSummary } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { EmptyState, Skeleton } from '@mijersey/ui';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';
import { VolumeDiscountProgress } from '../home/VolumeDiscountProgress';
import { RecentPurchaseToast, ViewersBadge } from '../promotions/SocialProofBar';
import { Reveal } from '../ui/Reveal';
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
  const [loadedPage, setLoadedPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProducts(null);
    setLoadedPage(1);
    client
      .getPublicCollection(slug, { page: 1, pageSize: PAGE_SIZE })
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
  }, [client, slug]);

  async function handleLoadMore() {
    if (loadingMore) return;
    const nextPage = loadedPage + 1;
    setLoadingMore(true);
    try {
      const result = await client.getPublicCollection(slug, {
        page: nextPage,
        pageSize: PAGE_SIZE,
      });
      setProducts((prev) => [...(prev ?? []), ...result.products]);
      setTotal(result.total);
      setLoadedPage(nextPage);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar más productos.',
      );
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <VolumeDiscountProgress variant="inline" />

      <div className="flex items-center justify-between">
        <ViewersBadge />
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
          title="Esta colección todavía no tiene productos"
          description="Vuelve pronto para ver las novedades."
        />
      ) : (
        <Reveal>
          <ProductGrid products={products} view={state.view} />
          <div className="mt-8 flex flex-col items-center gap-3">
            <span className="tf-caption text-neutral-400">
              Mostrando {products.length} de {total} productos
            </span>
            {products.length < total && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn-pop-outline disabled:opacity-50"
              >
                {loadingMore ? 'Cargando…' : 'Mostrar más productos'}
              </button>
            )}
          </div>
        </Reveal>
      )}

      {products && products.length > 0 && (
        <RecentPurchaseToast productNames={products.map((p) => p.name)} />
      )}
    </div>
  );
}
