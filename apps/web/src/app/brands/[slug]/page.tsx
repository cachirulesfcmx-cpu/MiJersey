import { ApiClient, ApiClientError } from '@mijersey/sdk';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { env } from '../../../config/env';
import BrandDetailClient from './BrandDetailClient';

function getClient() {
  return new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });
}

async function loadBrand(slug: string) {
  try {
    return await getClient().getPublicBrand(slug);
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
  const brand = await loadBrand(params.slug);
  if (!brand) {
    return { title: 'Marca no encontrada' };
  }

  const { seo } = brand;
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
      ...(seo.ogImageUrl ? { images: [seo.ogImageUrl] } : {}),
    },
  };
}

export default async function BrandDetailPage({ params }: { params: { slug: string } }) {
  const brand = await loadBrand(params.slug);
  if (!brand) {
    notFound();
  }

  const structuredData = brand.seo.structuredData ?? {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: brand.name,
    description: brand.seo.metaDescription ?? undefined,
    url: brand.seo.canonicalUrl,
    logo: brand.logoUrl ?? undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <BrandDetailClient brand={brand} slug={params.slug} />
    </>
  );
}
