'use client';

import type { CollectionRuleMatchType, CollectionRuleValue, CollectionType } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useRouter } from 'next/navigation';
import { type FormEvent, useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';
import { RuleBuilder } from '../RuleBuilder';

export default function NewCollectionPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const router = useRouter();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CollectionType>('MANUAL');
  const [matchType, setMatchType] = useState<CollectionRuleMatchType>('ALL');
  const [rules, setRules] = useState<CollectionRuleValue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const collection = await client.createCollection(accessToken, {
        name,
        ...(slug ? { slug } : {}),
        ...(description ? { description } : {}),
        type,
        ...(type === 'SMART' ? { matchType, rules } : {}),
      });
      router.push(`/collections/${collection.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo crear la colección.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Nueva colección</h1>

      <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
        <FormField label="Nombre" htmlFor="name">
          <Input required value={name} onChange={(event) => setName(event.target.value)} />
        </FormField>

        <FormField
          label="Slug"
          htmlFor="slug"
          hint="Si lo dejas vacío, se genera a partir del nombre."
        >
          <Input value={slug} onChange={(event) => setSlug(event.target.value)} />
        </FormField>

        <FormField label="Descripción" htmlFor="description">
          <Input value={description} onChange={(event) => setDescription(event.target.value)} />
        </FormField>

        <FormField label="Tipo" htmlFor="type">
          <select
            id="type"
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
            value={type}
            onChange={(event) => setType(event.target.value as CollectionType)}
          >
            <option value="MANUAL">Manual (eliges los productos a mano)</option>
            <option value="SMART">Inteligente (se arma sola con reglas)</option>
          </select>
        </FormField>

        {type === 'SMART' && (
          <RuleBuilder
            matchType={matchType}
            rules={rules}
            onChange={(nextMatchType, nextRules) => {
              setMatchType(nextMatchType);
              setRules(nextRules);
            }}
          />
        )}

        {error && (
          <p role="alert" className="text-danger-600 text-sm">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" isLoading={isSubmitting}>
            Crear
          </Button>
        </div>
      </form>
    </div>
  );
}
