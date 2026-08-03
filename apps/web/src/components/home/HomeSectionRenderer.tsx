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
        <section className="bg-arena-950 relative flex h-[78vh] min-h-[440px] w-full items-end overflow-hidden sm:h-[85vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={headline}
            loading={priority ? 'eager' : 'lazy'}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Vignette doble: vertical (legibilidad del texto) + radial sutil (profundidad, look "editorial" en vez de foto plana) */}
          <div className="from-arena-950 via-arena-950/50 absolute inset-0 bg-gradient-to-t to-transparent" />
          <div className="from-arena-950/40 absolute inset-0 bg-gradient-to-r to-transparent sm:to-transparent" />
          <div className="relative z-10 flex flex-col gap-5 p-6 text-white sm:p-16">
            <span className="tf-caption w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1 text-white backdrop-blur-sm">
              MiJersey
            </span>
            <h1 className="font-display max-w-3xl text-5xl uppercase leading-[0.95] tracking-wide sm:text-7xl">
              {headline}
            </h1>
            {str(c.subheadline) && (
              <p className="max-w-xl text-base text-white/80 sm:text-lg">{str(c.subheadline)}</p>
            )}
            {str(c.ctaLabel) && str(c.ctaUrl) && (
              <Link href={str(c.ctaUrl)} className="btn-pop mt-2 w-fit">
                {str(c.ctaLabel)}
              </Link>
            )}
          </div>
          {/* Indicador de scroll — puramente decorativo, ayuda a comunicar que hay más contenido debajo del fold. */}
          <div className="absolute bottom-6 right-6 z-10 hidden animate-bounce sm:block">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="text-white/70"
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </section>
      );
    }

    case 'BANNER_GRID': {
      const grid = banners(c.banners).filter((b) => b.imageUrl);
      if (grid.length === 0) return null;
      return (
        <section className="tf-section py-10 sm:py-14">
          <div className="tf-container flex items-end justify-between gap-4 pb-6">
            <h2 className="font-display text-arena-950 text-2xl uppercase tracking-wide sm:text-3xl">
              Destacados
            </h2>
          </div>
          {/* Tira horizontal con scroll-snap + recorte diagonal por tarjeta — inspirado en el
              banner-slider de bartjerseys.com, sin copiar su layout/assets/copy. */}
          <div className="hide-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-2 sm:px-6">
            {grid.map((banner, index) => {
              const content = (
                <div
                  className="group relative h-72 w-64 overflow-hidden sm:h-96 sm:w-80"
                  style={{ clipPath: 'polygon(7% 0, 100% 0, 93% 100%, 0 100%)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.imageUrl ?? undefined}
                    alt={banner.title ?? ''}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="from-arena-950/90 via-arena-950/15 absolute inset-0 bg-gradient-to-t to-transparent" />
                  {banner.title && (
                    <span className="font-display absolute bottom-8 left-8 right-8 text-xl uppercase leading-tight tracking-wide text-white sm:text-2xl">
                      {banner.title}
                    </span>
                  )}
                </div>
              );
              return (
                <div key={`${section.id}-${index}`} className="shrink-0 snap-start">
                  {banner.linkUrl ? <Link href={banner.linkUrl}>{content}</Link> : content}
                </div>
              );
            })}
          </div>
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
        <section className="flex flex-col gap-4 p-3 sm:gap-6 sm:p-8">
          {str(c.heading) && (
            <h2 className="font-display text-arena-950 text-2xl uppercase tracking-wide sm:text-3xl">
              {str(c.heading)}
            </h2>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {list.map((item) => (
              <Link
                key={item.id}
                href={`${basePath}/${item.slug}`}
                className="group flex flex-col gap-2 rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    className="aspect-square w-full rounded-xl bg-neutral-50 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="aspect-square w-full rounded-xl bg-neutral-50" />
                )}
                <span className="truncate text-sm font-medium text-neutral-900">{item.name}</span>
                {typeof item.fromPrice === 'number' && (
                  <span className="font-display text-pop-600 text-lg tracking-wide">
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
              <h2 className="font-display text-arena-950 text-2xl uppercase tracking-wide sm:text-3xl">
                {str(c.headline)}
              </h2>
            )}
            {str(c.ctaLabel) && str(c.ctaUrl) && (
              <Link href={str(c.ctaUrl)} className="btn-pop w-fit">
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
              <h2 className="font-display text-arena-950 text-2xl uppercase tracking-wide sm:text-3xl">
                {str(c.title)}
              </h2>
            )}
            {str(c.body) && <p className="text-neutral-600">{str(c.body)}</p>}
            {str(c.ctaLabel) && str(c.ctaUrl) && (
              <Link href={str(c.ctaUrl)} className="btn-pop w-fit">
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
