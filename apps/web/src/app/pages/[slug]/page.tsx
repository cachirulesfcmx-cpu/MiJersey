import type { PageBlock } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { env } from '../../../config/env';

function getClient() {
  return new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });
}

async function loadPage(slug: string) {
  try {
    return await getClient().getPublishedPage(slug);
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
  const page = await loadPage(params.slug);
  if (!page) return { title: 'Página no encontrada' };

  return {
    title: page.seoTitle ?? page.title,
    ...(page.seoDescription ? { description: page.seoDescription } : {}),
  };
}

function renderBlock(block: PageBlock) {
  switch (block.type) {
    case 'RICH_TEXT':
    case 'HTML': {
      const html = (block.config.html as string | undefined) ?? '';
      return (
        // eslint-disable-next-line react/no-danger
        <div
          key={block.id}
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    case 'IMAGE': {
      const mediaUrl = block.config.mediaUrl as string | undefined;
      const alt = (block.config.alt as string | undefined) ?? '';
      const linkUrl = block.config.linkUrl as string | undefined;
      if (!mediaUrl) return null;
      const img = (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaUrl} alt={alt} className="w-full rounded-md" />
      );
      return <div key={block.id}>{linkUrl ? <a href={linkUrl}>{img}</a> : img}</div>;
    }
    case 'HERO': {
      const imageUrl = block.config.imageUrl as string | undefined;
      const headline = block.config.headline as string | undefined;
      const subheadline = block.config.subheadline as string | undefined;
      const ctaLabel = block.config.ctaLabel as string | undefined;
      const ctaUrl = block.config.ctaUrl as string | undefined;
      return (
        <div
          key={block.id}
          className="flex flex-col gap-3 rounded-md bg-neutral-100 p-8 text-center"
          style={
            imageUrl ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover' } : undefined
          }
        >
          {headline && <h2 className="text-3xl font-semibold text-neutral-900">{headline}</h2>}
          {subheadline && <p className="text-neutral-600">{subheadline}</p>}
          {ctaLabel && ctaUrl && (
            <a
              href={ctaUrl}
              className="bg-brand-600 hover:bg-brand-700 mx-auto rounded-md px-4 py-2 text-sm font-medium text-white"
            >
              {ctaLabel}
            </a>
          )}
        </div>
      );
    }
    case 'CTA': {
      const headline = block.config.headline as string | undefined;
      const buttonLabel = block.config.buttonLabel as string | undefined;
      const buttonUrl = block.config.buttonUrl as string | undefined;
      return (
        <div
          key={block.id}
          className="flex flex-col items-center gap-3 rounded-md border border-neutral-200 p-6 text-center"
        >
          {headline && <p className="text-lg font-medium text-neutral-900">{headline}</p>}
          {buttonLabel && buttonUrl && (
            <a
              href={buttonUrl}
              className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white"
            >
              {buttonLabel}
            </a>
          )}
        </div>
      );
    }
    case 'SPACER': {
      const height = (block.config.height as number | undefined) ?? 32;
      return <div key={block.id} style={{ height }} />;
    }
    default:
      return null;
  }
}

export default async function CmsPage({ params }: { params: { slug: string } }) {
  const page = await loadPage(params.slug);
  if (!page) notFound();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-semibold text-neutral-900">{page.title}</h1>
      <div className="flex flex-col gap-6">{page.blocks.map(renderBlock)}</div>
    </main>
  );
}
