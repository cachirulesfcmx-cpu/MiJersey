import type { Post } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { AuthorCard } from '../../../components/blog/AuthorCard';
import { PostCard } from '../../../components/blog/PostCard';
import { env } from '../../../config/env';

function getClient() {
  return new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });
}

async function loadPost(slug: string): Promise<Post | null> {
  try {
    return await getClient().getPublishedPost(slug);
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
  const post = await loadPost(params.slug);
  if (!post) return { title: 'Artículo no encontrado' };

  const title = post.seoTitle ?? post.title;
  const description = post.seoDescription ?? post.excerpt ?? undefined;
  const canonical = `/blog/${post.slug}`;

  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical },
    openGraph: {
      title,
      ...(description ? { description } : {}),
      url: canonical,
      type: 'article',
      ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
      authors: [`${post.author.firstName} ${post.author.lastName}`],
      ...(post.featuredImage ? { images: [{ url: post.featuredImage }] } : {}),
    },
    twitter: {
      card: post.featuredImage ? 'summary_large_image' : 'summary',
      title,
      ...(description ? { description } : {}),
      ...(post.featuredImage ? { images: [post.featuredImage] } : {}),
    },
  };
}

export default async function BlogArticlePage({ params }: { params: { slug: string } }) {
  const post = await loadPost(params.slug);
  if (!post) notFound();

  const related = await getClient().getRelatedPosts(post.slug);
  const baseUrl = env.NEXT_PUBLIC_WEB_URL.replace(/\/$/, '');

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    image: post.featuredImage ?? undefined,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
    author: { '@type': 'Person', name: `${post.author.firstName} ${post.author.lastName}` },
    mainEntityOfPage: `${baseUrl}/blog/${post.slug}`,
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <div className="flex flex-col gap-3">
        {post.featuredImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.featuredImage}
            alt={post.title}
            className="aspect-video w-full rounded-3xl object-cover"
          />
        )}
        <h1 className="section-heading">{post.title}</h1>
        {post.publishedAt && (
          <p className="text-sm text-neutral-500">
            {new Date(post.publishedAt).toLocaleDateString('es-MX')}
          </p>
        )}
      </div>

      <AuthorCard author={post.author} />

      {/* eslint-disable-next-line react/no-danger */}
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />

      {(post.categories.length > 0 || post.tags.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {post.categories.map((category) => (
            <a
              key={category.id}
              href={`/blog/category/${category.slug}`}
              className="badge-pop bg-arena-800"
            >
              {category.name}
            </a>
          ))}
          {post.tags.map((tag) => (
            <a key={tag.id} href={`/blog/tag/${tag.slug}`} className="badge-pop">
              #{tag.name}
            </a>
          ))}
        </div>
      )}

      {related.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="section-heading text-xl">Artículos relacionados</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {related.map((relatedPost) => (
              <PostCard key={relatedPost.id} post={relatedPost} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
