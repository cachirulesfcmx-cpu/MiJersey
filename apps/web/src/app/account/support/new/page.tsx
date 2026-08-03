'use client';

import type { TicketCategory } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField } from '@mijersey/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';

import { Breadcrumbs } from '../../../../components/plp/Breadcrumbs';
import {
  INPUT_OVERRIDE_CLASS,
  PRIMARY_BUTTON_OVERRIDE_CLASS,
} from '../../../../components/ui/form-styles';
import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'ORDER_ISSUE', label: 'Problema con un pedido' },
  { value: 'RETURN_REFUND', label: 'Devolución o reembolso' },
  { value: 'SHIPPING', label: 'Envío' },
  { value: 'PRODUCT', label: 'Producto' },
  { value: 'BILLING', label: 'Facturación' },
];

/** Formulario de creación de tickets (spec 025 §6). Si llega desde el detalle de un pedido (`?orderId=`), preselecciona la categoría "Problema con un pedido" y referencia el pedido. */
export default function NewTicketPage() {
  return (
    <Suspense fallback={null}>
      <NewTicketForm />
    </Suspense>
  );
}

function NewTicketForm() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') ?? undefined;
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>(orderId ? 'ORDER_ISSUE' : 'GENERAL');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const ticket = await client.createTicket(accessToken, {
        subject,
        category,
        ...(orderId ? { orderId } : {}),
      });
      if (message.trim()) {
        await client.replyToMyTicket(accessToken, ticket.id, { message });
      }
      router.push(`/account/support/${ticket.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear el ticket.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: 'Cuenta', href: '/account' },
          { label: 'Mis tickets', href: '/account/support' },
          { label: 'Nuevo ticket' },
        ]}
      />

      <h1 className="section-heading">Nuevo ticket</h1>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="card-arena flex flex-col gap-4"
      >
        <FormField label="Asunto" htmlFor="ticket-subject">
          <input
            id="ticket-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className={INPUT_OVERRIDE_CLASS}
            required
          />
        </FormField>

        <FormField label="Categoría" htmlFor="ticket-category">
          <select
            id="ticket-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as TicketCategory)}
            className={`h-11 ${INPUT_OVERRIDE_CLASS}`}
          >
            {CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Cuéntanos qué pasó" htmlFor="ticket-message">
          <textarea
            id="ticket-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            className={INPUT_OVERRIDE_CLASS}
            required
          />
        </FormField>

        {error && <p className="text-danger-600 text-sm">{error}</p>}

        <Button
          type="submit"
          isLoading={isSubmitting}
          className={`!self-start ${PRIMARY_BUTTON_OVERRIDE_CLASS}`}
        >
          Crear ticket
        </Button>
      </form>
    </main>
  );
}
