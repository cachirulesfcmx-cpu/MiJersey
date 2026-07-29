import type { Metadata } from 'next';

import { Breadcrumbs } from '../../components/plp/Breadcrumbs';
import { ProductListingClient } from '../../components/plp/ProductListingClient';
import { RelatedMatches } from '../../components/search/RelatedMatches';

export function generateMetadata({ searchParams }: { searchParams: { q?: string } }): Metadata {
  const query = searchParams.q;
  return {
    title: query ? `Resultados para "${query}"` : 'Buscar productos',
    robots: { index: false, follow: true },
  };
}

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Buscar' }]} />
      <h1 className="text-3xl font-semibold text-neutral-900">
        {query ? `Resultados para "${query}"` : 'Buscar productos'}
      </h1>
      {query && <RelatedMatches term={query} />}
      <ProductListingClient scope={{}} showSearchBox />
    </main>
  );
}
