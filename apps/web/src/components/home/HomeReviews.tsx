'use client';

import type { FeaturedReview } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';
import { StarRating } from '../ui/StarRating';

/**
 * Reseñas reales (APPROVED, rating >= 4) destacadas en el home — mismo criterio "solo datos
 * reales" del resto del rediseño: si todavía no hay reseñas aprobadas, la sección no se muestra
 * (nunca se inventan testimonios ni calificaciones).
 */
export function HomeReviews() {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [reviews, setReviews] = useState<FeaturedReview[] | null>(null);

  useEffect(() => {
    client
      .listFeaturedReviews(8)
      .then(({ items }) => setReviews(items))
      .catch(() => setReviews([]));
  }, [client]);

  if (!reviews || reviews.length === 0) return null;

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section className="tf-section py-10 sm:py-14">
      <div className="tf-container flex flex-col gap-3 pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <h2 className="font-display text-arena-950 text-2xl uppercase tracking-wide sm:text-3xl">
          Lo que dicen nuestros clientes
        </h2>
        <div className="flex items-center gap-2">
          <StarRating value={average} size={18} />
          <span className="text-sm font-medium text-neutral-700">
            {average.toFixed(1)} · {reviews.length} reseña{reviews.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
      <div className="hide-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:px-6">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="card-arena flex w-72 shrink-0 snap-start flex-col gap-3 sm:w-80"
          >
            <div className="flex items-center gap-3">
              {review.product?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={review.product.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded-lg bg-neutral-100" />
              )}
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <span className="truncate text-sm font-medium text-neutral-900">
                  {review.authorName}
                </span>
                {review.product && (
                  <Link
                    href={`/products/${review.product.slug}`}
                    className="link-underline truncate text-xs"
                  >
                    {review.product.name}
                  </Link>
                )}
              </div>
            </div>
            <StarRating value={review.rating} size={16} />
            {review.title && (
              <span className="text-sm font-semibold text-neutral-900">{review.title}</span>
            )}
            {review.body && <p className="line-clamp-4 text-sm text-neutral-600">{review.body}</p>}
            {review.isVerifiedPurchase && (
              <span className="tf-caption w-fit text-neutral-400">Compra verificada</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
