'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

export interface HeroSlide {
  id: string;
  imageUrl: string;
  headline: string;
  subheadline: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
}

const AUTOPLAY_MS = 6000;

/**
 * Agrupa todas las secciones HERO_BANNER publicadas del home en un solo carrusel real
 * (auto-rotación + dots + flechas), en vez de apilar cada una como un bloque separado de
 * pantalla completa. Con un solo slide se ve igual que antes (sin controles), sin datos falsos:
 * cada slide viene de una sección HERO_BANNER real curada en /admin.
 */
export function HeroCarousel({ slides, priority }: { slides: HeroSlide[]; priority: boolean }) {
  const [active, setActive] = useState(0);
  const hasMultiple = slides.length > 1;

  const goTo = useCallback(
    (index: number) => {
      setActive((prev) => {
        const total = slides.length;
        return total === 0 ? 0 : ((index % total) + total) % total;
      });
    },
    [slides.length],
  );

  useEffect(() => {
    if (!hasMultiple) return;
    const interval = setInterval(() => goTo(active + 1), AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, [active, goTo, hasMultiple]);

  if (slides.length === 0) return null;

  return (
    <section className="bg-arena-950 relative flex h-[78vh] min-h-[440px] w-full items-end overflow-hidden sm:h-[85vh]">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          aria-hidden={index !== active}
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{
            opacity: index === active ? 1 : 0,
            pointerEvents: index === active ? 'auto' : 'none',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.imageUrl}
            alt={slide.headline}
            loading={priority && index === 0 ? 'eager' : 'lazy'}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="from-arena-950 via-arena-950/50 absolute inset-0 bg-gradient-to-t to-transparent" />
          <div className="from-arena-950/40 absolute inset-0 bg-gradient-to-r to-transparent sm:to-transparent" />
          <div className="relative z-10 flex flex-col gap-5 p-6 text-white sm:p-16">
            <span className="tf-caption w-fit rounded-full border border-white/25 bg-white/10 px-3 py-1 text-white backdrop-blur-sm">
              MiJersey
            </span>
            <h1 className="font-display max-w-3xl text-5xl uppercase leading-[0.95] tracking-wide sm:text-7xl">
              {slide.headline}
            </h1>
            {slide.subheadline && (
              <p className="max-w-xl text-base text-white/80 sm:text-lg">{slide.subheadline}</p>
            )}
            {slide.ctaLabel && slide.ctaUrl && (
              <Link href={slide.ctaUrl} className="btn-pop mt-2 w-fit">
                {slide.ctaLabel}
              </Link>
            )}
          </div>
        </div>
      ))}

      {hasMultiple && (
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => goTo(active - 1)}
            className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/25 bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:flex"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => goTo(active + 1)}
            className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/25 bg-white/10 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:flex"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Ir al slide ${index + 1}`}
                onClick={() => goTo(index)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: index === active ? '24px' : '8px',
                  background: index === active ? 'white' : 'rgba(255,255,255,0.45)',
                }}
              />
            ))}
          </div>
        </>
      )}

      {!hasMultiple && (
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
      )}
    </section>
  );
}
