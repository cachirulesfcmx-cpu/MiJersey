'use client';

import type { BrandProductSortBy, BrandProductSummary, PublicBrand } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';

const PAGE_SIZE = 12;

const SORT_OPTIONS: { value: BrandProductSortBy; label: string }[] = [
  { value: 'name', label: 'Nombre (A-Z)' },
  { value: 'createdAt', label: 'Más recientes' },
];

export default function BrandDetailClient({ brand, slug }: { brand: PublicBrand; slug: string }) {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [products, setProducts] = useState<BrandProductSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<BrandProductSortBy>('name');
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const result = await client.listPublicBrandProducts(slug, {
        page,
        pageSize: PAGE_SIZE,
        sortBy,
        sortDir: 'asc',
      });
      setProducts(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'No se pudieron cargar los productos.',
      );
    }
  }, [client, slug, page, sortBy]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <nav className="text-sm text-neutral-500">
        <Link href="/" className="hover:underline">
          Inicio
        </Link>
        <span className="mx-2">/</span>
        <Link href="/brands" className="hover:underline">
          Marcas
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-900">{brand.name}</span>
      </nav>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      {brand.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={brand.coverUrl}
          alt={brand.name}
          className="h-48 w-full rounded-lg object-cover sm:h-64"
        />
      )}

      <div className="flex items-center gap-4">
        {brand.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logoUrl}
            alt={brand.name}
            className="h-16 w-16 rounded-full border border-neutral-200 object-contain"
          />
        )}
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">{brand.name}</h1>
          {brand.country && <p className="text-sm text-neutral-500">{brand.country}</p>}
        </div>
      </div>

      {brand.description && <p className="max-w-3xl text-neutral-600">{brand.description}</p>}

      {brand.website && (
        <a
          href={brand.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 self-start text-sm hover:underline"
        >
          Visitar sitio web
        </a>
      )}

      <div className="flex items-center justify-between border-t border-neutral-200 pt-6">
        <h2 className="text-lg font-semibold text-neutral-900">Productos</h2>
        <select
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value as BrandProductSortBy);
            setPage(1);
          }}
          className="rounded-md border border-neutral-200 px-3 py-2 text-sm"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {!products ? (
        <p className="text-neutral-400">Cargando productos…</p>
      ) : products.length === 0 ? (
        <p className="text-neutral-400">Esta marca todavía no tiene productos publicados.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="hover:border-brand-300 flex flex-col gap-2 rounded-lg border border-neutral-200 p-4 hover:shadow-sm"
              >
                <div className="aspect-square rounded-md bg-neutral-50" />
                <span className="text-sm font-medium text-neutral-900">{product.name}</span>
                <span className="text-xs text-neutral-400">{product.sku}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span>
              Página {page} de {totalPages} · {total} productos
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="rounded-md border border-neutral-200 px-3 py-1.5 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-md border border-neutral-200 px-3 py-1.5 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
