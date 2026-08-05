'use client';

import type { PublicHomeSection } from '@mijersey/sdk';
import Link from 'next/link';
import { useState } from 'react';

import { useCart } from '../../providers/cart-provider';
import { StarRating } from '../ui/StarRating';
import { NewsletterForm } from './NewsletterForm';

interface FeaturedItem {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  fromPrice?: number | null;
  compareAtPrice?: number | null;
  rating?: number | null;
  reviewCount?: number;
  defaultVariantId?: string | null;
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
  /** Texto corto opcional bajo el título (ej. "Envío incluido") -- solo se muestra si viene un
      dato real desde el script que puebla la sección, nunca un porcentaje inventado. */
  badge?: string | null;
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

/**
 * Tarjeta de producto en slider horizontal -- MISMO tratamiento que <ProductCard> del PLP
 * (ver apps/web/src/components/plp/ProductCard.tsx), clonado 1:1 de bartjerseys.com: imagen
 * casi cuadrada sin fondo CSS sintético (el fondo de color ya viene horneado en la foto),
 * esquinas rectas, badge de descuento rojo sólido sin redondear, título Helvetica regular,
 * precio rojo bold. Antes esta tarjeta y la del PLP se veían como dos componentes distintos
 * (colores/tipografía/esquinas diferentes) -- ahora comparten el mismo lenguaje visual.
 */
function ProductSliderCard({
  item,
  href,
  expressBanner,
}: {
  item: FeaturedItem;
  href: string;
  /** Banner rojo "Envío Express" -- solo se pasa cuando el llamador confirmó que es un servicio
      real (ver "Jersey sorpresa"), nunca por defecto. */
  expressBanner?: boolean;
}) {
  const { addItem } = useCart();
  const [status, setStatus] = useState<'idle' | 'adding' | 'added'>('idle');

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

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!item.defaultVariantId || status !== 'idle') return;
    setStatus('adding');
    try {
      await addItem({ variantId: item.defaultVariantId, quantity: 1 });
      setStatus('added');
      setTimeout(() => setStatus('idle'), 1800);
    } catch {
      setStatus('idle');
    }
  };

  return (
    <Link
      href={href}
      className="group flex w-48 shrink-0 snap-start flex-col gap-2 transition-transform duration-300 hover:-translate-y-1 sm:w-64"
    >
      <div
        className="relative aspect-square w-full overflow-hidden"
        style={{ background: 'var(--tf-neutral-100)' }}
      >
        {hasDiscount && (
          <span
            className="absolute left-0 top-3 z-10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white"
            style={{ background: 'var(--tf-danger)' }}
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
        {item.defaultVariantId && (
          <button
            type="button"
            onClick={handleQuickAdd}
            aria-label="Agregar al carrito"
            disabled={status !== 'idle'}
            className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-md transition-transform duration-200 hover:scale-110 active:scale-95 disabled:opacity-80"
            style={{ background: 'var(--tf-danger)' }}
          >
            {status === 'added' ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  d="M6 6h15l-1.5 9h-12z M6 6L5 3H2 M9 20a1 1 0 100-2 1 1 0 000 2zM18 20a1 1 0 100-2 1 1 0 000 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        )}
        {expressBanner && (
          <span
            className="absolute inset-x-0 bottom-0 z-10 py-2 text-center text-sm font-bold uppercase tracking-wide text-white"
            style={{ background: 'var(--tf-danger)' }}
          >
            ⚡ Envío express
          </span>
        )}
      </div>
      <span className="truncate text-sm font-normal text-neutral-900">{item.name}</span>
      {typeof item.rating === 'number' && (item.reviewCount ?? 0) > 0 && (
        <div className="flex items-center gap-1.5">
          <StarRating value={item.rating} size={13} />
          <span className="tf-caption text-neutral-400">{item.reviewCount}</span>
        </div>
      )}
      {typeof item.fromPrice === 'number' && (
        <div className="flex items-baseline gap-2">
          {hasDiscount && (
            <span className="text-xs text-neutral-400 line-through">
              {formatMxn(item.compareAtPrice as number)}
            </span>
          )}
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: 'var(--tf-danger)' }}
          >
            {formatMxn(item.fromPrice)}
          </span>
        </div>
      )}
    </Link>
  );
}

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
            <h2 className="font-display text-arena-950 text-3xl uppercase tracking-wide sm:text-4xl">
              {str(c.heading) || 'Compra por liga'}
            </h2>
          </div>
          {/* Grid recto, sin cortes diagonales -- bartjerseys.com no usa clip-path en ninguna
              parte de su sitio (confirmado inspeccionando su DOM/CSS en vivo), todas sus
              tarjetas son rectángulos simples. */}
          <div className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:gap-4 sm:px-6">
            {list.map((item) => (
              <Link
                key={item.id}
                href={`/categories/${item.slug}`}
                className="group relative flex h-40 w-40 shrink-0 snap-start items-end overflow-hidden bg-neutral-900 transition-transform duration-300 hover:-translate-y-1 sm:h-52 sm:w-52"
              >
                {item.imageUrl ? (
                  // La imagen de categoría (logo de liga) ya trae su propio fondo y nombre --
                  // se muestra a pantalla completa sin overlay ni texto duplicado encima.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <>
                    <div className="from-arena-950 absolute inset-0 bg-gradient-to-t via-black/10 to-transparent" />
                    <span className="font-display relative z-10 w-full px-4 pb-4 text-center text-xl uppercase leading-none tracking-wide text-white sm:text-2xl">
                      {item.name}
                    </span>
                  </>
                )}
              </Link>
            ))}
          </div>
        </section>
      );
    }

    case 'BANNER_GRID': {
      const grid = banners(c.banners).filter((b) => b.imageUrl);
      if (grid.length === 0) return null;
      // "Explora" (tools/populate-explore-banners.mjs) reutiliza BANNER_GRID para el slider
      // lateral de categorías/promos reales -- se distingue visualmente de "Destacados" con
      // fotos en blanco y negro, sin usar fotografía de acción de jugadores (no tenemos
      // licencia para eso), solo fotos reales del catálogo.
      const isExplore = section.title === 'Explora';
      return (
        <section className="tf-section py-10 sm:py-14">
          <div className="tf-container flex items-end justify-between gap-4 pb-6">
            <h2 className="font-display text-arena-950 text-3xl uppercase tracking-wide sm:text-4xl">
              {isExplore ? 'Explora' : 'Destacados'}
            </h2>
          </div>
          {/* Tira horizontal con scroll-snap -- rectángulos rectos, sin recorte diagonal
              (bartjerseys.com no usa clip-path en ningún banner de su sitio). */}
          <div className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:gap-4 sm:px-6">
            {grid.map((banner, index) => {
              const content = (
                <div className="group relative h-64 w-56 overflow-hidden sm:h-80 sm:w-72">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.imageUrl ?? undefined}
                    alt={banner.title ?? ''}
                    loading="lazy"
                    className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                      isExplore ? 'grayscale' : ''
                    }`}
                  />
                  <div className="from-arena-950/90 via-arena-950/15 absolute inset-0 bg-gradient-to-t to-transparent" />
                  {banner.title && (
                    <span className="font-display absolute bottom-6 left-6 right-6 text-lg uppercase leading-tight tracking-wide text-white sm:text-xl">
                      {banner.title}
                    </span>
                  )}
                  {isExplore && banner.badge && (
                    <span
                      className="absolute bottom-2 left-6 px-2 py-1 text-xs font-bold uppercase tracking-wide text-white"
                      style={{ background: 'var(--tf-danger)' }}
                    >
                      {banner.badge}
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
      // "Jersey sorpresa" (tools/enable-secret-jersey.mjs) reutiliza FEATURED_PRODUCTS para poder
      // mostrar 1 a N variantes reales (Actual/Retro/Selecciones...) en vez de estar limitado a
      // un solo producto -- con tratamiento especial: fondo oscuro, heading neón y el banner de
      // envío express (confirmado real, no una afirmación inventada).
      const isSecretJersey = section.title === 'Jersey sorpresa';
      return (
        <section className="tf-section flex flex-col gap-4 py-8 sm:gap-6 sm:py-12">
          <div className="tf-container flex flex-col gap-1">
            {str(c.heading) && (
              <h2
                className={`font-display text-3xl uppercase tracking-wide sm:text-4xl ${
                  isSecretJersey ? 'text-neon-gradient' : 'text-arena-950'
                }`}
              >
                {str(c.heading)}
              </h2>
            )}
          </div>
          <div className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:gap-4 sm:px-6">
            {list.map((item) => (
              <ProductSliderCard
                key={item.id}
                expressBanner={isSecretJersey}
                item={item}
                href={`${basePath}/${item.slug}`}
              />
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
          <img src={imageUrl} alt={str(c.headline)} loading="lazy" className="max-h-40" />
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
        <div className="relative w-full overflow-hidden sm:w-1/2">
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
            className="tf-container relative flex flex-col items-center gap-8 overflow-hidden p-6 sm:flex-row sm:p-12"
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
                <h2 className="text-neon-gradient font-display text-4xl uppercase leading-tight tracking-wide sm:text-5xl">
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
            className="w-full"
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
