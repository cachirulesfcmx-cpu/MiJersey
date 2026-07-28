import type { PublicCategory } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '../../../components/plp/Breadcrumbs';
import { ProductListingClient } from '../../../components/plp/ProductListingClient';
import { env } from '../../../config/env';

function getClient() {
  return new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });
}

async function loadCategory(slug: string): Promise<PublicCategory | null> {
  try {
    return await getClient().getPublicCategory(slug);
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
  const category = await loadCategory(params.slug);
  if (!category) {
    return { title: 'Categoría no encontrada' };
  }

  const { seo } = category;
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

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await loadCategory(params.slug);
  if (!category) {
    notFound();
  }

  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    ...category.breadcrumbs.map((ancestor, index) => ({
      label: ancestor.name,
      ...(index < category.breadcrumbs.length - 1 ? { href: `/categories/${ancestor.slug}` } : {}),
    })),
  ];

  const webBaseUrl = category.seo.canonicalUrl.replace(/\/categories\/.*$/, '');
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${webBaseUrl}${item.href}` } : {}),
    })),
  };

  const structuredData = category.seo.structuredData ?? breadcrumbJsonLd;

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <Breadcrumbs items={breadcrumbItems} />
        <h1 className="text-3xl font-semibold text-neutral-900">{category.name}</h1>
        {category.description && (
          <p className="max-w-3xl text-neutral-600">{category.description}</p>
        )}
        <ProductListingClient scope={{ categoryId: category.id }} />
      </main>
    </>
  );
}
