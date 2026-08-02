'use client';

import type { EmailLayout } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

interface LayoutForm {
  name: string;
  html: string;
  css: string;
}

function emptyForm(): LayoutForm {
  return { name: '', html: '<html><body>{{content}}</body></html>', css: '' };
}

/** Layout Editor (spec 031 §6) — layouts reutilizables sin versionado propio; `html` debe incluir `{{content}}`, validado también en el backend (`CreateEmailLayoutUseCase`/`UpdateEmailLayoutUseCase`). */
export default function EmailLayoutsPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [layouts, setLayouts] = useState<EmailLayout[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LayoutForm>(emptyForm());

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await client.listEmailLayouts(accessToken);
      setLayouts(result);
      setIsLoaded(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudieron cargar los layouts.');
    }
  }, [client, accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(layout: EmailLayout) {
    setEditingId(layout.id);
    setForm({ name: layout.name, html: layout.html, css: layout.css ?? '' });
  }

  function startNew() {
    setEditingId(null);
    setForm(emptyForm());
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      if (editingId) {
        await client.updateEmailLayout(accessToken, editingId, {
          name: form.name,
          html: form.html,
          css: form.css,
        });
        setSuccessMessage('Layout actualizado.');
      } else {
        await client.createEmailLayout(accessToken, {
          name: form.name,
          html: form.html,
          ...(form.css ? { css: form.css } : {}),
        });
        setSuccessMessage('Layout creado.');
        startNew();
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar el layout.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    setError(null);
    setSuccessMessage(null);
    try {
      await client.deleteEmailLayout(accessToken, id);
      if (editingId === id) startNew();
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo eliminar el layout.');
    }
  }

  if (!isLoaded) return <p className="text-sm text-neutral-500">Cargando…</p>;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Layouts de correo</h1>
        <p className="text-sm text-neutral-500">
          Chrome reutilizable (header/footer/estilos) para las plantillas transaccionales.
        </p>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}
      {successMessage && <p className="text-success-600 text-sm">{successMessage}</p>}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-900">Layouts existentes</h2>
        <ul className="flex flex-col gap-2">
          {layouts.length === 0 && <p className="text-sm text-neutral-500">Sin layouts todavía.</p>}
          {layouts.map((layout) => (
            <li
              key={layout.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 p-3 text-sm"
            >
              <span>{layout.name}</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => startEdit(layout)}
                  className="text-brand-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(layout.id)}
                  className="text-danger-600 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
        <section className="flex flex-col gap-4 rounded-md border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">
              {editingId ? 'Editar layout' : 'Nuevo layout'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={startNew}
                className="text-xs text-neutral-500 hover:underline"
              >
                Cancelar edición
              </button>
            )}
          </div>
          <FormField label="Nombre" htmlFor="layout-name">
            <Input
              id="layout-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </FormField>
          <FormField
            label="HTML"
            htmlFor="layout-html"
            hint="Debe incluir el placeholder {{content}}"
          >
            <textarea
              id="layout-html"
              value={form.html}
              onChange={(e) => setForm((prev) => ({ ...prev, html: e.target.value }))}
              rows={8}
              required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm"
            />
          </FormField>
          <FormField label="CSS (opcional)" htmlFor="layout-css" hint="Insertado vía {{css}}">
            <textarea
              id="layout-css"
              value={form.css}
              onChange={(e) => setForm((prev) => ({ ...prev, css: e.target.value }))}
              rows={4}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm"
            />
          </FormField>
          <Button type="submit" isLoading={isSaving} className="self-start">
            {editingId ? 'Guardar cambios' : 'Crear layout'}
          </Button>
        </section>
      </form>
    </div>
  );
}
