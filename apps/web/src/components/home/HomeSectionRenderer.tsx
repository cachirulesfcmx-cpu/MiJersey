import type { PublicHomeSection } from '@mijersey/sdk';
import Link from 'next/link';

import { NewsletterForm } from './NewsletterForm';

interface FeaturedItem {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  fromPrice?: number | null;
}

interface BannerGridItem {
  imageUrl: string | null;
  title: string | null;
  linkUrl: string | null;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function strOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function items(value: unknown): FeaturedItem[] {
  return Array.isArray(value) ? (value as FeaturedItem[]) : [];
}

function banners(value: unknown): BannerGridItem[] {
  return Array.isArray(value) ? (value as BannerGridItem[]) : [];
}

const ENTITY_PATH_BY_TYPE: Record<string, string> = {
  FEATURED_PRODUCTS: '/products',
  FEATURED_CATEGORIES: '/categories',
  FEATURED_COLLECTIONS: '/collections',
  FEATURED_BRANDS: '/brands',
};

export function HomeSectionRenderer({
  section,
  priority,
}: {
  section: PublicHomeSection;
  priority: boolean;
}) {
  const c = section.configuration;

  switch (section.type) {
    case 'HERO_BANNER': {
      const imageUrl = strOrNull(c.imageUrl);
      const headline = str(c.headline);
      if (!imageUrl || !headline) return null;
      return (
        <section className="relative flex h-[60vh] min-h-[320px] w-full items-end overflow-hidden bg-neutral-100 sm:h-[70vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={headline}
            loading={priority ? 'eager' : 'lazy'}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative z-10 flex flex-col gap-3 bg-gradient-to-t from-black/60 to-transparent p-8 text-white sm:p-12">
            <h1 className="max-w-2xl text-3xl font-semibold sm:text-5xl">{headline}</h1>
            {str(c.subheadline) && <p className="max-w-xl text-lg">{str(c.subheadline)}</p>}
            {str(c.ctaLabel) && str(c.ctaUrl) && (
              <Link
                href={str(c.ctaUrl)}
                className="bg-brand-600 hover:bg-brand-700 mt-2 inline-block w-fit rounded-md px-5 py-2.5 text-sm font-medium"
              >
                {str(c.ctaLabel)}
              </Link>
            )}
          </div>
        </section>
      );
    }

    case 'BANNER_GRID': {
      const grid = banners(c.banners).filter((b) => b.imageUrl);
      if (grid.length === 0) return null;
      return (
        <section className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {grid.map((banner, index) => {
            const content = (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={banner.imageUrl ?? undefined}
                alt={banner.title ?? ''}
                loading="lazy"
                className="h-56 w-full rounded-lg object-cover"
              />
            );
            return (
              <div key={`${section.id}-${index}`} className="flex flex-col gap-2">
                {banner.linkUrl ? <Link href={banner.linkUrl}>{content}</Link> : content}
                {banner.title && (
                  <p className="text-sm font-medium text-neutral-900">{banner.title}</p>
                )}
              </div>
            );
          })}
        </section>
      );
    }

    case 'FEATURED_PRODUCTS':
    case 'FEATURED_CATEGORIES':
    case 'FEATURED_COLLECTIONS':
    case 'FEATURED_BRANDS': {
      const list = items(c.items);
      if (list.length === 0) return null;
      const basePath = ENTITY_PATH_BY_TYPE[section.type] ?? '/';
      return (
        <section className="flex flex-col gap-4 p-4 sm:p-8">
          {str(c.heading) && (
            <h2 className="text-xl font-semibold text-neutral-900">{str(c.heading)}</h2>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {list.map((item) => (
              <Link
                key={item.id}
                href={`${basePath}/${item.slug}`}
                className="hover:border-brand-300 flex flex-col gap-2 rounded-lg border border-neutral-200 p-3 hover:shadow-sm"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    className="aspect-square w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="aspect-square w-full rounded-md bg-neutral-50" />
                )}
                <span className="text-sm font-medium text-neutral-900">{item.name}</span>
                {typeof item.fromPrice === 'number' && (
                  <span className="text-xs text-neutral-500">
                    Desde ${item.fromPrice.toFixed(2)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      );
    }

    case 'PROMOTION_BANNER': {
      const imageUrl = strOrNull(c.imageUrl);
      if (!imageUrl) return null;
      const backgroundColor = str(c.backgroundColor) || undefined;
      return (
        <section
          className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:justify-between sm:text-left"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={str(c.headline)}
            loading="lazy"
            className="max-h-40 rounded-md"
          />
          <div className="flex flex-col gap-2">
            {str(c.headline) && (
              <h2 className="text-2xl font-semibold text-neutral-900">{str(c.headline)}</h2>
            )}
            {str(c.ctaLabel) && str(c.ctaUrl) && (
              <Link
                href={str(c.ctaUrl)}
                className="bg-brand-600 hover:bg-brand-700 w-fit rounded-md px-5 py-2.5 text-sm font-medium text-white"
              >
                {str(c.ctaLabel)}
              </Link>
            )}
          </div>
        </section>
      );
    }

    case 'RICH_TEXT': {
      const html = str(c.html);
      if (!html) return null;
      return (
        <section
          className="prose mx-auto max-w-3xl p-8"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    case 'IMAGE_TEXT': {
      const imageUrl = strOrNull(c.imageUrl);
      if (!imageUrl) return null;
      const imageFirst = str(c.imagePosition) !== 'right';
      return (
        <section className="flex flex-col items-center gap-8 p-8 sm:flex-row">
          {imageFirst && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={str(c.title)}
              loading="lazy"
              className="w-full rounded-lg sm:w-1/2"
            />
          )}
          <div className="flex flex-1 flex-col gap-3">
            {str(c.title) && (
              <h2 className="text-2xl font-semibold text-neutral-900">{str(c.title)}</h2>
            )}
            {str(c.body) && <p className="text-neutral-600">{str(c.body)}</p>}
            {str(c.ctaLabel) && str(c.ctaUrl) && (
              <Link
                href={str(c.ctaUrl)}
                className="bg-brand-600 hover:bg-brand-700 w-fit rounded-md px-5 py-2.5 text-sm font-medium text-white"
              >
                {str(c.ctaLabel)}
              </Link>
            )}
          </div>
          {!imageFirst && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={str(c.title)}
              loading="lazy"
              className="w-full rounded-lg sm:w-1/2"
            />
          )}
        </section>
      );
    }

    case 'VIDEO_BANNER': {
      const videoUrl = str(c.videoUrl);
      if (!videoUrl) return null;
      return (
        <section className="flex flex-col gap-3 p-8">
          {str(c.headline) && (
            <h2 className="text-2xl font-semibold text-neutral-900">{str(c.headline)}</h2>
          )}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            controls
            preload="none"
            poster={strOrNull(c.posterImageUrl) ?? undefined}
            className="w-full rounded-lg"
          >
            <source src={videoUrl} />
          </video>
        </section>
      );
    }

    case 'NEWSLETTER':
      return (
        <section className="flex flex-col items-center gap-4 bg-neutral-50 p-8 text-center">
          {str(c.headline) && (
            <h2 className="text-2xl font-semibold text-neutral-900">{str(c.headline)}</h2>
          )}
          {str(c.subheadline) && <p className="text-neutral-600">{str(c.subheadline)}</p>}
          <NewsletterForm />
        </section>
      );

    default:
      return null;
  }
}
