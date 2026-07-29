import type { PublicProduct } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { env } from '../../../config/env';
import ProductDetailClient from './ProductDetailClient';

function getClient() {
  return new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });
}

async function loadProduct(slug: string): Promise<PublicProduct | null> {
  try {
    return await getClient().getPublicProduct(slug);
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
  const product = await loadProduct(params.slug);
  if (!product) {
    return { title: 'Producto no encontrado' };
  }

  const { seo } = product;
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

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await loadProduct(params.slug);
  if (!product) {
    notFound();
  }

  const webBaseUrl = product.seo.canonicalUrl.replace(/\/products\/.*$/, '');
  const breadcrumbItems = [
    { label: 'Inicio', href: '/' },
    ...(product.categories[0]
      ? [{ label: product.categories[0].name, href: `/categories/${product.categories[0].slug}` }]
      : []),
    { label: product.name },
  ];

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

  const productJsonLd = product.seo.structuredData ?? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.seo.metaDescription ?? undefined,
    sku: product.sku,
    image: product.galleryUrls,
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand.name } } : {}),
    offers: product.variants.map((variant) => ({
      '@type': 'Offer',
      sku: variant.sku,
      price: variant.price,
      priceCurrency: 'MXN',
      availability: variant.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: product.seo.canonicalUrl,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetailClient product={product} breadcrumbItems={breadcrumbItems} />
    </>
  );
}
