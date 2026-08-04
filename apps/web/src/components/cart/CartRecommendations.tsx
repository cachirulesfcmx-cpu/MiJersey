'use client';

import type { ProductSearchSummary } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';
import { ProductGrid } from '../plp/ProductGrid';

/**
 * "También te puede gustar" del carrito -- productos reales del catálogo público (mismo motor
 * de /products/search que usa el PLP), no una lista inventada. Se excluyen los productos que ya
 * están en el carrito para no recomendar lo que ya se va a comprar.
 */
export function CartRecommendations({ excludeProductIds }: { excludeProductIds: string[] }) {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [products, setProducts] = useState<ProductSearchSummary[]>([]);

  useEffect(() => {
    client
      .searchProducts({ page: 1, pageSize: 8, sortBy: 'createdAt', sortDir: 'desc' })
      .then((result) => setProducts(result.items))
      .catch(() => setProducts([]));
  }, [client]);

  const filtered = products.filter((p) => !excludeProductIds.includes(p.id)).slice(0, 4);
  if (filtered.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-neutral-200 pt-6">
      <h2 className="font-display text-arena-950 text-lg uppercase tracking-wide">
        También te puede gustar
      </h2>
      <ProductGrid products={filtered} view="grid" />
    </div>
  );
}
