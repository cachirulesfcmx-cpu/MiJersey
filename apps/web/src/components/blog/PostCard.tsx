import type { Post } from '@mijersey/sdk';
import Link from 'next/link';

/** Tarjeta de artículo reutilizada por Blog Home, Category Archive y Tag Archive (spec 027 §6). */
export function PostCard({ post }: { post: Post }) {
  return (
    <article className="card-arena group flex flex-col gap-2">
      {post.featuredImage && (
        <div className="-mx-4 -mt-4 mb-1 aspect-video overflow-hidden rounded-t-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.featuredImage}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <Link href={`/blog/${post.slug}`}>
        <h2 className="group-hover:text-pop-600 text-lg font-semibold text-neutral-900">
          {post.title}
        </h2>
      </Link>
      {post.excerpt && <p className="text-sm text-neutral-600">{post.excerpt}</p>}
      <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
        {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString('es-MX')}</span>}
        {post.categories.map((category) => (
          <Link
            key={category.id}
            href={`/blog/category/${category.slug}`}
            className="badge-pop bg-arena-800"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </article>
  );
}
