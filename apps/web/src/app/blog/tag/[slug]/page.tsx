import { ApiClient } from '@mijersey/sdk';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PostCard } from '../../../../components/blog/PostCard';
import { env } from '../../../../config/env';

function getClient() {
  return new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return {
    title: `Blog — #${params.slug} | MiJersey`,
    alternates: { canonical: `/blog/tag/${params.slug}` },
  };
}

/** Tag Archive (spec 027 §6): mismo endpoint público de listado, filtrado por etiqueta. */
export default async function BlogTagArchivePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const page = Number(searchParams.page ?? '1') || 1;
  const pageSize = 12;
  const result = await getClient().listPublishedPosts({ page, pageSize, tag: params.slug });
  const totalPages = Math.max(1, Math.ceil(result.total / pageSize));
  const tagName = result.items[0]?.tags.find((t) => t.slug === params.slug)?.name;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <Link href="/blog" className="link-underline text-sm">
          ← Blog
        </Link>
        <h1 className="section-heading">Etiqueta: #{tagName ?? params.slug}</h1>
      </div>

      {result.items.length === 0 && (
        <p className="text-sm text-neutral-500">No hay artículos con esta etiqueta.</p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <div className="flex justify-center gap-6 text-sm">
        {page > 1 && (
          <Link href={`/blog/tag/${params.slug}?page=${page - 1}`} className="link-underline">
            Anterior
          </Link>
        )}
        {page < totalPages && (
          <Link href={`/blog/tag/${params.slug}?page=${page + 1}`} className="link-underline">
            Siguiente
          </Link>
        )}
      </div>
    </main>
  );
}
