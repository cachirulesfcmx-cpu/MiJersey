'use client';

import type {
  ApiClient,
  SeoEntityType,
  SeoRobotsDirective,
  SeoTwitterCardType,
  UpsertSeoMetadataInput,
} from '@mijersey/sdk';
import { ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useEffect, useState } from 'react';

import { MediaPicker } from './MediaPicker';

interface SeoMetadataEditorProps {
  entityType: SeoEntityType;
  entityId: string;
  accessToken: string;
  client: ApiClient;
  /** URL pública de la entidad — usada para la vista previa SERP cuando no hay canonical propio. */
  publicUrl: string;
}

interface FormState {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  robots: SeoRobotsDirective;
  ogTitle: string;
  ogDescription: string;
  ogImageMediaId: string | null;
  twitterCard: SeoTwitterCardType;
  structuredData: string;
}

const EMPTY_STATE: FormState = {
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  canonicalUrl: '',
  robots: 'INDEX_FOLLOW',
  ogTitle: '',
  ogDescription: '',
  ogImageMediaId: null,
  twitterCard: 'SUMMARY_LARGE_IMAGE',
  structuredData: '',
};

export function SeoMetadataEditor({
  entityType,
  entityId,
  accessToken,
  client,
  publicUrl,
}: SeoMetadataEditorProps) {
  const [values, setValues] = useState<FormState>(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    client
      .getSeoMetadata(accessToken, entityType, entityId)
      .then((metadata) => {
        if (!metadata) return;
        setValues({
          metaTitle: metadata.metaTitle ?? '',
          metaDescription: metadata.metaDescription ?? '',
          metaKeywords: metadata.metaKeywords ?? '',
          canonicalUrl: metadata.canonicalUrl ?? '',
          robots: metadata.robots,
          ogTitle: metadata.ogTitle ?? '',
          ogDescription: metadata.ogDescription ?? '',
          ogImageMediaId: metadata.ogImageMediaId,
          twitterCard: metadata.twitterCard,
          structuredData: metadata.structuredData
            ? JSON.stringify(metadata.structuredData, null, 2)
            : '',
        });
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, [client, accessToken, entityType, entityId]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setError(null);
    let structuredData: Record<string, unknown> | null = null;
    if (values.structuredData.trim()) {
      try {
        structuredData = JSON.parse(values.structuredData) as Record<string, unknown>;
      } catch {
        setError('El JSON-LD (datos estructurados) no es válido.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const input: UpsertSeoMetadataInput = {
        metaTitle: values.metaTitle.trim() || null,
        metaDescription: values.metaDescription.trim() || null,
        metaKeywords: values.metaKeywords.trim() || null,
        canonicalUrl: values.canonicalUrl.trim() || null,
        robots: values.robots,
        ogTitle: values.ogTitle.trim() || null,
        ogDescription: values.ogDescription.trim() || null,
        ogImageMediaId: values.ogImageMediaId,
        twitterCard: values.twitterCard,
        structuredData,
      };
      await client.upsertSeoMetadata(accessToken, entityType, entityId, input);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar el SEO.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-neutral-400">Cargando SEO…</p>;
  }

  const serpTitle = values.metaTitle || '(sin título SEO)';
  const serpUrl = values.canonicalUrl || publicUrl;
  const serpDescription = values.metaDescription || '(sin descripción SEO)';

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-neutral-900">SEO</h2>

      {error && <p className="text-danger-600 text-sm">{error}</p>}

      <div className="rounded-md border border-neutral-200 p-4">
        <p className="mb-2 text-xs font-medium uppercase text-neutral-400">
          Vista previa en buscadores
        </p>
        <p className="truncate text-sm text-neutral-500">{serpUrl}</p>
        <p className="truncate text-lg text-blue-700">{serpTitle}</p>
        <p className="line-clamp-2 text-sm text-neutral-600">{serpDescription}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Título SEO" htmlFor="metaTitle" hint={`${values.metaTitle.length}/70`}>
          <Input
            id="metaTitle"
            value={values.metaTitle}
            onChange={(event) => set('metaTitle', event.target.value)}
            maxLength={70}
          />
        </FormField>

        <FormField label="Robots" htmlFor="robots">
          <select
            id="robots"
            className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
            value={values.robots}
            onChange={(event) => set('robots', event.target.value as SeoRobotsDirective)}
          >
            <option value="INDEX_FOLLOW">Indexar y seguir enlaces</option>
            <option value="NOINDEX_FOLLOW">No indexar, seguir enlaces</option>
            <option value="INDEX_NOFOLLOW">Indexar, no seguir enlaces</option>
            <option value="NOINDEX_NOFOLLOW">No indexar ni seguir enlaces</option>
          </select>
        </FormField>
      </div>

      <FormField
        label="Descripción SEO"
        htmlFor="metaDescription"
        hint={`${values.metaDescription.length}/160`}
      >
        <textarea
          id="metaDescription"
          rows={3}
          maxLength={160}
          className="focus-visible:outline-brand-500 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          value={values.metaDescription}
          onChange={(event) => set('metaDescription', event.target.value)}
        />
      </FormField>

      <FormField label="Palabras clave" htmlFor="metaKeywords" hint="Separadas por comas.">
        <Input
          id="metaKeywords"
          value={values.metaKeywords}
          onChange={(event) => set('metaKeywords', event.target.value)}
        />
      </FormField>

      <FormField label="URL canónica" htmlFor="canonicalUrl" hint={`Por defecto: ${publicUrl}`}>
        <Input
          id="canonicalUrl"
          value={values.canonicalUrl}
          onChange={(event) => set('canonicalUrl', event.target.value)}
          placeholder={publicUrl}
        />
      </FormField>

      <div className="rounded-md border border-neutral-200 p-4">
        <p className="mb-3 text-xs font-medium uppercase text-neutral-400">
          Open Graph / Twitter Card
        </p>
        <div className="flex flex-col gap-4">
          <FormField label="Título OG" htmlFor="ogTitle">
            <Input
              id="ogTitle"
              value={values.ogTitle}
              onChange={(event) => set('ogTitle', event.target.value)}
            />
          </FormField>
          <FormField label="Descripción OG" htmlFor="ogDescription">
            <Input
              id="ogDescription"
              value={values.ogDescription}
              onChange={(event) => set('ogDescription', event.target.value)}
            />
          </FormField>
          <MediaPicker
            label="Imagen OG"
            accessToken={accessToken}
            client={client}
            value={values.ogImageMediaId}
            onChange={(mediaId) => set('ogImageMediaId', mediaId)}
          />
          <FormField label="Tipo de Twitter Card" htmlFor="twitterCard">
            <select
              id="twitterCard"
              className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
              value={values.twitterCard}
              onChange={(event) => set('twitterCard', event.target.value as SeoTwitterCardType)}
            >
              <option value="SUMMARY">Summary</option>
              <option value="SUMMARY_LARGE_IMAGE">Summary con imagen grande</option>
            </select>
          </FormField>
        </div>
      </div>

      <FormField
        label="Datos estructurados (JSON-LD)"
        htmlFor="structuredData"
        hint="Opcional — JSON válido según schema.org."
      >
        <textarea
          id="structuredData"
          rows={6}
          className="focus-visible:outline-brand-500 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 font-mono text-xs text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          value={values.structuredData}
          onChange={(event) => set('structuredData', event.target.value)}
        />
      </FormField>

      <Button
        type="button"
        isLoading={isSaving}
        className="self-start"
        onClick={() => void handleSave()}
      >
        Guardar SEO
      </Button>
    </div>
  );
}
