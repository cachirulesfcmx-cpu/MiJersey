'use client';

import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { useMemo, useState } from 'react';

import { env } from '../../config/env';

/** Suscripción real al newsletter (footer, estilo bartjerseys.com "Suscríbete a nuestros emails")
 * -- a diferencia del resto del rediseño de fase 2 que solo copia UI, esto sí persiste el correo
 * real del visitante (POST /newsletter/subscribe, tabla newsletter_subscribers). */
export function NewsletterSignupForm() {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    setErrorMessage(null);
    try {
      await client.subscribeToNewsletter({ email, source: 'footer' });
      setStatus('done');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof ApiClientError ? err.message : 'No se pudo completar la suscripción.',
      );
    }
  }

  if (status === 'done') {
    return (
      <p className="tf-small" style={{ color: 'var(--tf-text-muted)' }}>
        ¡Listo! Ya estás suscrito a nuestras ofertas.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@correo.com"
          className="input-arena flex-1 py-2 text-sm"
          disabled={status === 'submitting'}
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="btn-pop shrink-0 px-4 py-2 text-sm disabled:opacity-50"
        >
          {status === 'submitting' ? '...' : 'Suscribir'}
        </button>
      </div>
      {status === 'error' && errorMessage && (
        <p className="text-danger-600 text-xs">{errorMessage}</p>
      )}
    </form>
  );
}
