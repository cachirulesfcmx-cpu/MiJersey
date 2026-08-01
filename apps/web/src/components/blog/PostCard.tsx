import type { Post } from '@mijersey/sdk';
import Link from 'next/link';

/** Tarjeta de artículo reutilizada por Blog Home, Category Archive y Tag Archive (spec 027 §6). */
export function PostCard({ post }: { post: Post }) {
  return (
    <article className="flex flex-col gap-2 rounded-md border border-neutral-200 p-4">
      {post.featuredImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.featuredImage}
          alt={post.title}
          className="aspect-video w-full rounded-md object-cover"
        />
      )}
      <Link href={`/blog/${post.slug}`} className="hover:underline">
        <h2 className="text-lg font-semibold text-neutral-900">{post.title}</h2>
      </Link>
      {post.excerpt && <p className="text-sm text-neutral-600">{post.excerpt}</p>}
      <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
        {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString('es-MX')}</span>}
        {post.categories.map((category) => (
          <Link
            key={category.id}
            href={`/blog/category/${category.slug}`}
            className="rounded-full bg-neutral-100 px-2 py-0.5 hover:bg-neutral-200"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </article>
  );
}
