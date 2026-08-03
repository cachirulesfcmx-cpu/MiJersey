import type { CollectionWithProducts } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '../../../components/plp/Breadcrumbs';
import { CollectionListingClient } from '../../../components/plp/CollectionListingClient';
import { env } from '../../../config/env';

function getClient() {
  return new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });
}

async function loadCollection(slug: string): Promise<CollectionWithProducts | null> {
  try {
    return await getClient().getPublicCollection(slug);
  } catch (err) {
    if (err instanceof ApiClientError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const collection = await loadCollection(params.slug);
  if (!collection) {
    return { title: 'Colección no encontrada' };
  }

  const { seo } = collection;
  const index = seo.robots === 'INDEX_FOLLOW' || seo.robots === 'INDEX_NOFOLLOW';
  const follow = seo.robots === 'INDEX_FOLLOW' || seo.robots === 'NOINDEX_FOLLOW';

  return {
    title: seo.metaTitle,
    ...(seo.metaDescription ? { description: seo.metaDescription } : {}),
    alternates: { canonical: seo.canonicalUrl },
    robots: { index, follow },
    openGraph: {
      title: seo.ogTitle,
      ...(seo.ogDescription ? { description: seo.ogDescription } : {}),
      url: seo.canonicalUrl,
      type: 'website',
      ...(seo.ogImageUrl ? { images: [{ url: seo.ogImageUrl }] } : {}),
    },
    twitter: {
      card: seo.twitterCard === 'SUMMARY_LARGE_IMAGE' ? 'summary_large_image' : 'summary',
      title: seo.ogTitle,
      ...(seo.ogDescription ? { description: seo.ogDescription } : {}),
    },
  };
}

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  const collection = await loadCollection(params.slug);
  if (!collection) {
    notFound();
  }

  const structuredData = collection.seo.structuredData ?? {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.name,
    description: collection.seo.metaDescription ?? undefined,
    url: collection.seo.canonicalUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Colecciones' },
            { label: collection.name },
          ]}
        />
        <h1 className="section-heading">{collection.name}</h1>
        {collection.description && (
          <p className="max-w-3xl text-neutral-600">{collection.description}</p>
        )}
        <CollectionListingClient slug={params.slug} />
      </main>
    </>
  );
}
