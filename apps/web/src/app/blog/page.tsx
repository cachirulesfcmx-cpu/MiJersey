import { ApiClient } from '@mijersey/sdk';
import type { Metadata } from 'next';
import Link from 'next/link';

import { PostCard } from '../../components/blog/PostCard';
import { env } from '../../config/env';

export const metadata: Metadata = {
  title: 'Blog | MiJersey',
  description: 'Artículos sobre cuidado, historia y colección de jerseys.',
  alternates: { canonical: '/blog' },
};

function getClient() {
  return new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });
}

/** Blog Home (spec 027 §6). */
export default async function BlogHomePage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Number(searchParams.page ?? '1') || 1;
  const pageSize = 12;
  const result = await getClient().listPublishedPosts({ page, pageSize });
  const totalPages = Math.max(1, Math.ceil(result.total / pageSize));

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-900">Blog</h1>
        <p className="text-neutral-600">Cuidado, historia y colección de jerseys.</p>
      </div>

      {result.items.length === 0 && (
        <p className="text-sm text-neutral-500">Todavía no hay artículos publicados.</p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <div className="flex justify-center gap-4 text-sm">
        {page > 1 && (
          <Link href={`/blog?page=${page - 1}`} className="text-brand-600 hover:underline">
            Anterior
          </Link>
        )}
        {page < totalPages && (
          <Link href={`/blog?page=${page + 1}`} className="text-brand-600 hover:underline">
            Siguiente
          </Link>
        )}
      </div>
    </main>
  );
}
