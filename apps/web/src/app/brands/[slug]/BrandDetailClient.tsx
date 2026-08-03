'use client';

import type { PublicBrand } from '@mijersey/sdk';

import { Breadcrumbs } from '../../../components/plp/Breadcrumbs';
import { ProductListingClient } from '../../../components/plp/ProductListingClient';

export default function BrandDetailClient({ brand }: { brand: PublicBrand }) {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Marcas', href: '/brands' },
          { label: brand.name },
        ]}
      />

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
          <h1 className="section-heading">{brand.name}</h1>
          {brand.country && <p className="text-sm text-neutral-500">{brand.country}</p>}
        </div>
      </div>

      {brand.description && <p className="max-w-3xl text-neutral-600">{brand.description}</p>}

      {brand.website && (
        <a
          href={brand.website}
          target="_blank"
          rel="noopener noreferrer"
          className="link-underline self-start text-sm"
        >
          Visitar sitio web
        </a>
      )}

      <div className="border-t border-neutral-200 pt-6">
        <h2 className="section-heading mb-4 text-xl sm:text-2xl">Productos</h2>
        <ProductListingClient scope={{ brandId: brand.id }} />
      </div>
    </main>
  );
}
