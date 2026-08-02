'use client';

import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';

/** Creación mínima de una plantilla (spec 031 §7 "POST /email/templates") — nace en `DRAFT`; el resto (layout, contenido final) se completa en el editor. */
export default function NewEmailTemplatePage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const router = useRouter();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [language, setLanguage] = useState('es');
  const [subject, setSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const template = await client.createEmailTemplate(accessToken, {
        name,
        key,
        language,
        subject,
        html: '<p>Hola {{name}}</p>',
        text: 'Hola {{name}}',
      });
      router.push(`/email-templates/${template.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear la plantilla.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Nueva plantilla</h1>

      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
        <FormField label="Nombre" htmlFor="template-name">
          <Input
            id="template-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Clave" htmlFor="template-key" hint="ej. order.confirmation">
          <Input id="template-key" value={key} onChange={(e) => setKey(e.target.value)} required />
        </FormField>

        <FormField label="Idioma" htmlFor="template-language" hint="ej. es, en">
          <Input
            id="template-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            required
          />
        </FormField>

        <FormField label="Asunto" htmlFor="template-subject">
          <Input
            id="template-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </FormField>

        {error && <p className="text-danger-600 text-sm">{error}</p>}

        <Button type="submit" isLoading={isSubmitting} className="self-start">
          Crear plantilla
        </Button>
      </form>
    </div>
  );
}
