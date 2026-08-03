'use client';

import type { SearchResultItem, SearchResultType } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';

const TYPE_PATH: Record<SearchResultType, string> = {
  PRODUCT: '/products',
  CATEGORY: '/categories',
  BRAND: '/brands',
  COLLECTION: '/collections',
};

const TYPE_LABEL: Record<SearchResultType, string> = {
  PRODUCT: 'Producto',
  CATEGORY: 'Categoría',
  BRAND: 'Marca',
  COLLECTION: 'Colección',
};

/** Coincidencias de categorías/marcas/colecciones para el término actual (016 §4) — los productos ya los muestra `ProductListingClient` con sus propios filtros facetados. */
export function RelatedMatches({ term }: { term: string }) {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [items, setItems] = useState<SearchResultItem[]>([]);

  useEffect(() => {
    if (!term.trim()) {
      setItems([]);
      return;
    }
    let cancelled = false;
    client
      .search({ q: term })
      .then((result) => {
        if (cancelled) return;
        setItems([...result.categories, ...result.brands, ...result.collections]);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [client, term]);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={`${item.type}-${item.id}`}
          href={`${TYPE_PATH[item.type]}/${item.slug}`}
          className="hover:border-pop-500 hover:text-pop-600 rounded-full border border-neutral-200 px-3 py-1 text-sm text-neutral-700 transition-colors"
        >
          <span className="text-neutral-400">{TYPE_LABEL[item.type]}:</span> {item.name}
        </Link>
      ))}
    </div>
  );
}
