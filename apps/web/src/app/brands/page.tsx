'use client';

import type { PublicBrand } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Reveal } from '../../components/ui/Reveal';
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
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <nav className="text-sm text-neutral-500">
        <Link href="/" className="link-underline">
          Inicio
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-900">Marcas</span>
      </nav>

      <h1 className="section-heading">Marcas</h1>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      {!brands ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index} className="skeleton-arena h-32 w-full" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <p className="text-neutral-400">Todavía no hay marcas publicadas.</p>
      ) : (
        <Reveal className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="card-arena flex flex-col items-center gap-3 text-center"
            >
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logoUrl} alt={brand.name} className="h-16 w-16 object-contain" />
              ) : (
                <div className="from-arena-800 to-arena-950 font-display flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-lg text-white">
                  {brand.name.charAt(0)}
                </div>
              )}
              <span className="font-medium text-neutral-900">{brand.name}</span>
            </Link>
          ))}
        </Reveal>
      )}
    </main>
  );
}
