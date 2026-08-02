'use client';

import type { EmailLayout, EmailTemplate, EmailTemplateVersion } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../../config/env';
import { useAuth } from '../../../../providers/auth-provider';

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.]*)\s*\}\}/g;

function extractVariables(...contents: string[]): string[] {
  const names = new Set<string>();
  for (const content of contents) {
    for (const match of content.matchAll(VARIABLE_PATTERN)) {
      const name = match[1]?.trim();
      if (name) names.add(name);
    }
  }
  return [...names];
}

function renderPreview(content: string, variables: Record<string, string>): string {
  return content.replace(VARIABLE_PATTERN, (_match, rawName: string) => {
    const name = rawName.trim();
    return name ? (variables[name] ?? '') : '';
  });
}

/** Template Editor + Variable Inspector + Email Preview + Version History + Test Send (spec 031 §6). El preview es una interpolación local (mismo patrón `{{variable}}` que el motor del backend) solo para visualizar antes de guardar — el render real ocurre en el servidor al publicar o al hacer Test Send. */
export default function EditEmailTemplatePage({ params }: { params: { id: string } }) {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [layouts, setLayouts] = useState<EmailLayout[]>([]);
  const [versions, setVersions] = useState<EmailTemplateVersion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [text, setText] = useState('');
  const [layoutId, setLayoutId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});
  const [testTo, setTestTo] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [tpl, layoutList, versionResult] = await Promise.all([
        client.getEmailTemplate(accessToken, params.id),
        client.listEmailLayouts(accessToken),
        client.listEmailTemplateVersions(accessToken, params.id, { pageSize: 50 }),
      ]);
      setTemplate(tpl);
      setLayouts(layoutList);
      setVersions(versionResult.items);
      setSubject(tpl.subject);
      setHtml(tpl.html);
      setText(tpl.text);
      setLayoutId(tpl.layoutId ?? '');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar la plantilla.');
    }
  }, [client, accessToken, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const variableNames = useMemo(() => extractVariables(subject, html, text), [subject, html, text]);
  const selectedLayout = layouts.find((layout) => layout.id === layoutId) ?? null;

  const previewHtml = useMemo(() => {
    const rendered = renderPreview(html, sampleValues);
    if (!selectedLayout) return rendered;
    return renderPreview(selectedLayout.html, { content: rendered, css: selectedLayout.css ?? '' });
  }, [html, sampleValues, selectedLayout]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await client.updateEmailTemplate(accessToken, params.id, {
        subject,
        html,
        text,
        layoutId: layoutId || null,
      });
      setSuccessMessage('Cambios guardados en el borrador.');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar la plantilla.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish() {
    if (!accessToken) return;
    setIsPublishing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await client.publishEmailTemplate(accessToken, params.id);
      setSuccessMessage('Plantilla publicada.');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo publicar la plantilla.');
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleTestSend() {
    if (!accessToken || !testTo) return;
    setIsTesting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await client.testSendEmailTemplate(accessToken, params.id, {
        to: testTo,
        variables: sampleValues,
      });
      setSuccessMessage(
        result.missingVariables.length > 0
          ? `Correo de prueba enviado. Variables sin valor: ${result.missingVariables.join(', ')}.`
          : 'Correo de prueba enviado.',
      );
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo enviar la prueba.');
    } finally {
      setIsTesting(false);
    }
  }

  async function handleRestore(versionNumber: number) {
    if (!accessToken) return;
    setError(null);
    setSuccessMessage(null);
    try {
      await client.restoreEmailTemplateVersion(accessToken, params.id, versionNumber);
      setSuccessMessage(`Versión ${versionNumber} restaurada en el borrador (recuerda publicar).`);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo restaurar la versión.');
    }
  }

  if (!template) return <p className="text-sm text-neutral-500">Cargando…</p>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{template.name}</h1>
          <p className="text-sm text-neutral-500">
            {template.key} · {template.language} · Estado: {template.status} · Versión{' '}
            {template.version}
          </p>
        </div>
        <Button onClick={() => void handlePublish()} isLoading={isPublishing}>
          Publicar
        </Button>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}
      {successMessage && <p className="text-success-600 text-sm">{successMessage}</p>}

      <form onSubmit={(event) => void handleSave(event)} className="flex flex-col gap-4">
        <section className="flex flex-col gap-4 rounded-md border border-neutral-200 p-4">
          <h2 className="text-sm font-semibold text-neutral-900">Template Editor</h2>
          <FormField label="Asunto" htmlFor="subject">
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </FormField>
          <FormField label="Layout" htmlFor="layoutId">
            <select
              id="layoutId"
              value={layoutId}
              onChange={(e) => setLayoutId(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">Sin layout</option>
              {layouts.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="HTML" htmlFor="html">
            <textarea
              id="html"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={10}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm"
            />
          </FormField>
          <FormField label="Texto plano" htmlFor="text">
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </FormField>
          <Button type="submit" isLoading={isSaving} className="self-start">
            Guardar borrador
          </Button>
        </section>
      </form>

      <section className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Variable Inspector</h2>
        {variableNames.length === 0 ? (
          <p className="text-sm text-neutral-500">Sin variables detectadas.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {variableNames.map((name) => (
              <FormField key={name} label={`{{${name}}}`} htmlFor={`var-${name}`}>
                <Input
                  id={`var-${name}`}
                  value={sampleValues[name] ?? ''}
                  onChange={(e) => setSampleValues((prev) => ({ ...prev, [name]: e.target.value }))}
                  placeholder="valor de ejemplo"
                />
              </FormField>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Email Preview</h2>
        <iframe
          title="Vista previa del correo"
          className="h-96 w-full rounded-md border border-neutral-200 bg-white"
          srcDoc={previewHtml}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Test Send</h2>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <FormField label="Enviar prueba a" htmlFor="test-to">
              <Input
                id="test-to"
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </FormField>
          </div>
          <Button type="button" onClick={() => void handleTestSend()} isLoading={isTesting}>
            Enviar prueba
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-900">Version History</h2>
        <ul className="flex flex-col gap-2">
          {versions.map((version) => (
            <li
              key={version.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 p-3 text-sm"
            >
              <span>
                Versión {version.versionNumber} — {version.snapshot.subject} (
                {new Date(version.createdAt).toLocaleString('es-MX')})
              </span>
              <button
                type="button"
                onClick={() => void handleRestore(version.versionNumber)}
                className="text-brand-600 hover:underline"
              >
                Restaurar
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
