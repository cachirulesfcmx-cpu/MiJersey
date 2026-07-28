'use client';

import { useState } from 'react';

/** Captura de email puramente presentacional — 013 no define un puerto de persistencia de suscriptores; conectarla a un proveedor real queda para un sprint dedicado de CRM/Email. */
export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return <p className="text-brand-700 text-sm font-medium">¡Gracias por suscribirte!</p>;
  }

  return (
    <form
      className="flex w-full max-w-md gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="tu@email.com"
        className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white"
      >
        Suscribirme
      </button>
    </form>
  );
}
