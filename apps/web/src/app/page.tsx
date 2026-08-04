import type { PublicHomeSection } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';
import type { Metadata } from 'next';

import type { HeroSlide } from '../components/home/HeroCarousel';
import { HeroCarousel } from '../components/home/HeroCarousel';
import { HomeFaq } from '../components/home/HomeFaq';
import { HomeReviews } from '../components/home/HomeReviews';
import { HomeSectionRenderer } from '../components/home/HomeSectionRenderer';
import { VolumeDiscountProgress } from '../components/home/VolumeDiscountProgress';
import { Reveal } from '../components/ui/Reveal';
import { env } from '../config/env';

export const metadata: Metadata = {
  title: 'MiJersey — Tienda oficial',
  description: 'Descubre las últimas colecciones, marcas y ofertas en MiJersey.',
  robots: { index: true, follow: true },
};

/** ISR: sin esto, Next prerenderiza `/` una sola vez en build y el admin editando la Home no vería cambios sin un redeploy. */
export const revalidate = 60;

async function getHomeSections(): Promise<PublicHomeSection[]> {
  const client = new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });
  try {
    const { sections } = await client.getPublicHome();
    return sections;
  } catch {
    return [];
  }
}

function toHeroSlide(section: PublicHomeSection): HeroSlide | null {
  const c = section.configuration;
  const imageUrl = typeof c.imageUrl === 'string' ? c.imageUrl : null;
  const headline = typeof c.headline === 'string' ? c.headline : '';
  if (!imageUrl || !headline) return null;
  return {
    id: section.id,
    imageUrl,
    headline,
    subheadline: typeof c.subheadline === 'string' ? c.subheadline : null,
    ctaLabel: typeof c.ctaLabel === 'string' ? c.ctaLabel : null,
    ctaUrl: typeof c.ctaUrl === 'string' ? c.ctaUrl : null,
  };
}

/** Agrupa secciones en bloques: todas las HERO_BANNER consecutivas se juntan en un solo carrusel real (ver HeroCarousel) en vez de apilarse como banners individuales. */
type HomeBlock =
  { kind: 'hero'; slides: HeroSlide[] } | { kind: 'section'; section: PublicHomeSection };

function groupSections(sections: PublicHomeSection[]): HomeBlock[] {
  const blocks: HomeBlock[] = [];
  let heroBuffer: HeroSlide[] = [];

  const flushHero = () => {
    if (heroBuffer.length > 0) {
      blocks.push({ kind: 'hero', slides: heroBuffer });
      heroBuffer = [];
    }
  };

  for (const section of sections) {
    if (section.type === 'HERO_BANNER') {
      const slide = toHeroSlide(section);
      if (slide) heroBuffer.push(slide);
      continue;
    }
    flushHero();
    blocks.push({ kind: 'section', section });
  }
  flushHero();

  return blocks;
}

export default async function HomePage() {
  const sections = await getHomeSections();

  if (sections.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <h1 className="text-3xl font-semibold text-neutral-900">MiJersey</h1>
        <p className="text-neutral-500">Muy pronto encontrarás aquí nuestras novedades.</p>
      </main>
    );
  }

  const blocks = groupSections(sections);

  return (
    <main className="flex flex-col">
      {blocks.map((block, index) =>
        block.kind === 'hero' ? (
          <HeroCarousel key={`hero-${index}`} slides={block.slides} priority={index === 0} />
        ) : (
          <Reveal key={block.section.id}>
            <HomeSectionRenderer section={block.section} />
          </Reveal>
        ),
      )}
      <Reveal>
        <VolumeDiscountProgress />
      </Reveal>
      <Reveal>
        <HomeReviews />
      </Reveal>
      <Reveal>
        <HomeFaq />
      </Reveal>
    </main>
  );
}
