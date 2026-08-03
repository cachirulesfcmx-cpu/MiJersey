import type { PublicHomeSection } from '@mijersey/sdk';
import Link from 'next/link';

import { NewsletterForm } from './NewsletterForm';

/** Paleta cíclica para el grid de ligas/categorías — no representa colores oficiales de ninguna liga, solo variedad visual entre tarjetas. */
const CATEGORY_GRADIENTS = [
  'from-slate-900 to-slate-700',
  'from-blue-950 to-blue-700',
  'from-emerald-950 to-emerald-700',
  'from-rose-950 to-rose-700',
  'from-amber-900 to-amber-600',
  'from-indigo-950 to-indigo-700',
  'from-teal-950 to-teal-700',
  'from-neutral-900 to-neutral-600',
];

interface FeaturedItem {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  fromPrice?: number | null;
  compareAtPrice?: number | null;
}

function formatMxn(value: number): string {
  return value.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
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

export function HomeSectionRenderer({ section }: { section: PublicHomeSection }) {
  const c = section.configuration;

  switch (section.type) {
    // HERO_BANNER se agrupa y renderiza vía <HeroCarousel> en page.tsx (junta todas las
    // secciones HERO_BANNER consecutivas en un solo carrusel real en vez de apilarlas).
    case 'HERO_BANNER':
      return null;

    case 'FEATURED_CATEGORIES': {
      const list = items(c.items);
      if (list.length === 0) return null;
      return (
        <section className="tf-section py-10 sm:py-14">
          <div className="tf-container flex items-end justify-between gap-4 pb-6">
            <h2 className="font-display text-arena-950 text-2xl uppercase tracking-wide sm:text-3xl">
              {str(c.heading) || 'Compra por liga'}
            </h2>
          </div>
          <div className="hide-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:px-6">
            {list.map((item, index) => {
              const gradient = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];
              return (
                <Link
                  key={item.id}
                  href={`/categories/${item.slug}`}
                  className={`group relative flex h-40 w-56 shrink-0 snap-start items-end overflow-hidden rounded-2xl bg-gradient-to-br p-5 transition-transform duration-300 hover:-translate-y-1 sm:h-48 sm:w-72 ${gradient}`}
                >
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover opacity-30 transition-opacity duration-300 group-hover:opacity-40"
                    />
                  )}
                  <span className="font-display relative z-10 text-xl uppercase leading-tight tracking-wide text-white sm:text-2xl">
                    {item.name}
                  </span>
                </Link>
              );
            })}
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
    case 'FEATURED_COLLECTIONS':
    case 'FEATURED_BRANDS': {
      const list = items(c.items);
      if (list.length === 0) return null;
      const basePath = ENTITY_PATH_BY_TYPE[section.type] ?? '/';
      return (
        <section className="tf-section flex flex-col gap-4 py-10 sm:gap-6 sm:py-14">
          <div className="tf-container">
            {str(c.heading) && (
              <h2 className="font-display text-arena-950 text-2xl uppercase tracking-wide sm:text-3xl">
                {str(c.heading)}
              </h2>
            )}
          </div>
          <div className="tf-container grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
            {list.map((item) => {
              const hasDiscount =
                typeof item.fromPrice === 'number' &&
                typeof item.compareAtPrice === 'number' &&
                item.compareAtPrice > item.fromPrice;
              const percentOff = hasDiscount
                ? Math.round(
                    (((item.compareAtPrice as number) - (item.fromPrice as number)) /
                      (item.compareAtPrice as number)) *
                      100,
                  )
                : 0;
              return (
                <Link
                  key={item.id}
                  href={`${basePath}/${item.slug}`}
                  className="group flex flex-col gap-2 overflow-hidden rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-50">
                    {hasDiscount && (
                      <span
                        className="badge-pop absolute left-2 top-2 z-10"
                        style={{ background: 'var(--tf-danger)', color: 'white' }}
                      >
                        -{percentOff}%
                      </span>
                    )}
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full" />
                    )}
                  </div>
                  <span className="truncate text-sm font-medium text-neutral-900">{item.name}</span>
                  {typeof item.fromPrice === 'number' && (
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-arena-950 text-lg tracking-wide">
                        Desde {formatMxn(item.fromPrice)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-neutral-400 line-through">
                          {formatMxn(item.compareAtPrice as number)}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
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
      const image = (
        <div className="relative w-full overflow-hidden rounded-2xl sm:w-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={str(c.title)}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      );
      return (
        <section className="tf-section py-10 sm:py-14">
          <div
            className="tf-container relative flex flex-col items-center gap-8 overflow-hidden rounded-3xl p-6 sm:flex-row sm:p-12"
            style={{ background: 'var(--tf-neutral-950)' }}
          >
            {/* Patrón decorativo de signos de interrogación — comunica "sorpresa" sin depender de que el texto lo diga. */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
              aria-hidden="true"
            >
              <pattern
                id={`qmark-${section.id}`}
                width="72"
                height="72"
                patternUnits="userSpaceOnUse"
              >
                <text x="8" y="52" fontSize="48" fontWeight="700" fill="white">
                  ?
                </text>
              </pattern>
              <rect width="100%" height="100%" fill={`url(#qmark-${section.id})`} />
            </svg>

            {imageFirst && image}
            <div className="relative z-10 flex flex-1 flex-col gap-4 text-center sm:text-left">
              {str(c.title) && (
                <h2 className="font-display text-3xl uppercase leading-tight tracking-wide text-white sm:text-4xl">
                  {str(c.title)}
                </h2>
              )}
              {str(c.body) && <p className="text-white/70 sm:text-lg">{str(c.body)}</p>}
              {str(c.ctaLabel) && str(c.ctaUrl) && (
                <Link href={str(c.ctaUrl)} className="btn-pop mx-auto w-fit sm:mx-0">
                  {str(c.ctaLabel)}
                </Link>
              )}
            </div>
            {!imageFirst && image}
          </div>
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
