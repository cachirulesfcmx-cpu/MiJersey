'use client';

import type { PublicBrand } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';

export default function BrandsIndexPage() {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [brands, setBrands] = useState<PublicBrand[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    client
      .listPublicBrands()
      .then((result) => setBrands(result.items))
      .catch((err: unknown) => {
        setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar las marcas.');
      });
  }, [client]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <nav className="text-sm text-neutral-500">
        <Link href="/" className="hover:underline">
          Inicio
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-900">Marcas</span>
      </nav>

      <h1 className="text-3xl font-semibold text-neutral-900">Marcas</h1>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      {!brands ? (
        <p className="text-neutral-400">Cargando…</p>
      ) : brands.length === 0 ? (
        <p className="text-neutral-400">Todavía no hay marcas publicadas.</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="hover:border-brand-300 flex flex-col items-center gap-3 rounded-lg border border-neutral-200 p-6 text-center hover:shadow-sm"
            >
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logoUrl} alt={brand.name} className="h-16 w-16 object-contain" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-lg font-semibold text-neutral-500">
                  {brand.name.charAt(0)}
                </div>
              )}
              <span className="font-medium text-neutral-900">{brand.name}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
