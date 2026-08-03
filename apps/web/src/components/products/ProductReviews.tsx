'use client';

import type { ProductReviewsResult } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';
import { StarRating } from '../ui/StarRating';

const RATING_KEYS = [5, 4, 3, 2, 1] as const;

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Hace 1 día';
  if (days < 30) return `Hace ${days} días`;
  return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Sección de reseñas de la ficha de producto (015) — lista solo lo aprobado + formulario de reseña
 * nueva (queda PENDING hasta moderación admin, spec ad-hoc fase 2). Componente autocontenido: no
 * requiere que `ProductDetailClient` sepa nada de reseñas más allá de renderizarlo con el slug. */
export function ProductReviews({ slug }: { slug: string }) {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [result, setResult] = useState<ProductReviewsResult | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    client
      .listProductReviews(slug)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {
        if (!cancelled) setResult(null);
      });
    return () => {
      cancelled = true;
    };
  }, [client, slug]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!authorName.trim()) {
      setSubmitError('Escribe tu nombre.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await client.createProductReview(slug, {
        authorName: authorName.trim(),
        rating,
        ...(title.trim() ? { title: title.trim() } : {}),
        ...(body.trim() ? { body: body.trim() } : {}),
      });
      setSubmitted(true);
      setShowForm(false);
      setAuthorName('');
      setTitle('');
      setBody('');
      setRating(5);
    } catch (err) {
      setSubmitError(
        err instanceof ApiClientError
          ? err.message
          : 'No se pudo enviar tu reseña. Intenta de nuevo.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const summary = result?.summary;
  const hasReviews = (summary?.count ?? 0) > 0;

  return (
    <section className="border-t border-neutral-200 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="section-heading text-xl sm:text-2xl">Reseñas</h2>
        {!showForm && (
          <button type="button" onClick={() => setShowForm(true)} className="btn-pop-outline">
            Escribir una reseña
          </button>
        )}
      </div>

      {submitted && (
        <p
          className="badge-pop mt-4 w-fit"
          style={{ background: 'var(--tf-success)', color: 'white' }}
        >
          Gracias por tu reseña — se publicará después de que la revisemos.
        </p>
      )}

      {hasReviews && summary && (
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-10">
          <div className="flex shrink-0 flex-col items-start gap-1">
            <span className="font-display text-4xl tracking-wide">
              {summary.average.toFixed(1)}
            </span>
            <StarRating value={summary.average} />
            <span className="text-xs text-neutral-400">
              {summary.count} {summary.count === 1 ? 'reseña' : 'reseñas'}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            {RATING_KEYS.map((star) => {
              const starCount = summary.breakdown[String(star) as '1' | '2' | '3' | '4' | '5'] ?? 0;
              const pct = summary.count > 0 ? Math.round((starCount / summary.count) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs text-neutral-500">
                  <span className="w-3">{star}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: 'var(--tf-accent)' }}
                    />
                  </div>
                  <span className="w-8 text-right">{starCount}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card-arena mt-6 flex max-w-lg flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="label-arena">Tu calificación</span>
            <StarRating value={rating} onChange={setRating} size={24} />
          </div>
          <input
            className="input-arena"
            placeholder="Tu nombre"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={80}
          />
          <input
            className="input-arena"
            placeholder="Título (opcional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />
          <textarea
            className="input-arena"
            placeholder="Cuéntanos tu experiencia (opcional)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={3}
          />
          {submitError && <p className="text-danger-600 text-sm">{submitError}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="btn-pop disabled:opacity-40">
              {submitting ? 'Enviando…' : 'Enviar reseña'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-pop-outline">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 flex flex-col divide-y divide-neutral-100">
        {result?.items.length === 0 && !hasReviews && (
          <p className="text-sm text-neutral-400">Todavía no hay reseñas para este producto.</p>
        )}
        {result?.items.map((review) => (
          <div key={review.id} className="flex flex-col gap-1.5 py-4 first:pt-0">
            <div className="flex items-center gap-2">
              <StarRating value={review.rating} size={14} />
              {review.isVerifiedPurchase && <span className="badge-pop">Compra verificada</span>}
            </div>
            {review.title && (
              <span className="text-sm font-semibold text-neutral-900">{review.title}</span>
            )}
            {review.body && <p className="text-sm text-neutral-600">{review.body}</p>}
            <span className="text-xs text-neutral-400">
              {review.authorName} · {formatRelativeDate(review.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
