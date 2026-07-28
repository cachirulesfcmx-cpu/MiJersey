import type { PublicHomeSection } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';
import type { Metadata } from 'next';

import { HomeSectionRenderer } from '../components/home/HomeSectionRenderer';
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

  return (
    <main className="flex flex-col">
      {sections.map((section, index) => (
        <HomeSectionRenderer key={section.id} section={section} priority={index === 0} />
      ))}
    </main>
  );
}
