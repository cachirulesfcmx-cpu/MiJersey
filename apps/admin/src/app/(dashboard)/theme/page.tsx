'use client';

import type { ThemeSectionKey, ThemeState, ThemeVersion } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

interface SettingsForm {
  siteName: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  typography: string;
  borderRadius: string;
  spacingScale: string;
}

interface FooterLinkForm {
  label: string;
  url: string;
}

interface FooterColumnForm {
  title: string;
  links: FooterLinkForm[];
}

interface HeaderForm {
  showSearch: boolean;
  showAccountLink: boolean;
  sticky: boolean;
}

interface FooterForm {
  columns: FooterColumnForm[];
  showNewsletter: boolean;
  copyrightText: string;
}

interface BannerForm {
  message: string;
  url: string;
  backgroundColor: string;
  dismissible: boolean;
}

interface LayoutForm {
  containerWidth: string;
  headerStyle: 'standard' | 'centered' | 'minimal';
}

function defaultSettings(): SettingsForm {
  return {
    siteName: 'MiJersey',
    logo: '',
    favicon: '',
    primaryColor: '#111827',
    secondaryColor: '#6B7280',
    typography: 'Inter, sans-serif',
    borderRadius: '8px',
    spacingScale: '1rem',
  };
}

function defaultHeader(): HeaderForm {
  return { showSearch: true, showAccountLink: true, sticky: false };
}

function defaultFooter(): FooterForm {
  return { columns: [], showNewsletter: true, copyrightText: '' };
}

function defaultBanner(): BannerForm {
  return { message: '', url: '', backgroundColor: '#111827', dismissible: true };
}

function defaultLayout(): LayoutForm {
  return { containerWidth: '1280px', headerStyle: 'standard' };
}

/** Theme Dashboard (spec 029 §7): editor del borrador (settings + 4 secciones), botón "Publicar" separado de "Guardar", Live Preview en línea, e historial de versiones — mismo criterio de guardar/publicar como acciones distintas que CMS Pages/Blog/Navigation. */
export default function ThemePage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [versions, setVersions] = useState<ThemeVersion[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [settings, setSettings] = useState<SettingsForm>(defaultSettings());
  const [header, setHeader] = useState<HeaderForm>(defaultHeader());
  const [headerEnabled, setHeaderEnabled] = useState(true);
  const [footer, setFooter] = useState<FooterForm>(defaultFooter());
  const [footerEnabled, setFooterEnabled] = useState(true);
  const [banner, setBanner] = useState<BannerForm>(defaultBanner());
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [layout, setLayout] = useState<LayoutForm>(defaultLayout());
  const [layoutEnabled, setLayoutEnabled] = useState(true);

  const applyState = useCallback((state: ThemeState) => {
    setSettings({
      siteName: state.settings.siteName,
      logo: state.settings.logo ?? '',
      favicon: state.settings.favicon ?? '',
      primaryColor: state.settings.primaryColor,
      secondaryColor: state.settings.secondaryColor,
      typography: state.settings.typography,
      borderRadius: state.settings.borderRadius,
      spacingScale: state.settings.spacingScale,
    });

    const byKey = new Map(state.sections.map((section) => [section.section, section]));

    const headerSection = byKey.get('HEADER');
    setHeader({ ...defaultHeader(), ...(headerSection?.config ?? {}) });
    setHeaderEnabled(headerSection?.enabled ?? true);

    const footerSection = byKey.get('FOOTER');
    setFooter({ ...defaultFooter(), ...(footerSection?.config ?? {}) } as FooterForm);
    setFooterEnabled(footerSection?.enabled ?? true);

    const bannerSection = byKey.get('BANNER');
    setBanner({ ...defaultBanner(), ...(bannerSection?.config ?? {}) } as BannerForm);
    setBannerEnabled(bannerSection?.enabled ?? false);

    const layoutSection = byKey.get('LAYOUT');
    setLayout({ ...defaultLayout(), ...(layoutSection?.config ?? {}) } as LayoutForm);
    setLayoutEnabled(layoutSection?.enabled ?? true);
  }, []);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [state, versionsResult] = await Promise.all([
        client.getAdminTheme(accessToken),
        client.listThemeVersions(accessToken, { pageSize: 20 }),
      ]);
      applyState(state);
      setVersions(versionsResult.items);
      setIsLoaded(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar el tema.');
    }
  }, [client, accessToken, applyState]);

  useEffect(() => {
    void load();
  }, [load]);

  function buildSections(): Array<{
    section: ThemeSectionKey;
    config: Record<string, unknown>;
    enabled: boolean;
  }> {
    return [
      { section: 'HEADER', config: { ...header }, enabled: headerEnabled },
      { section: 'FOOTER', config: { ...footer }, enabled: footerEnabled },
      { section: 'BANNER', config: { ...banner }, enabled: bannerEnabled },
      { section: 'LAYOUT', config: { ...layout }, enabled: layoutEnabled },
    ];
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await client.updateTheme(accessToken, {
        settings: {
          siteName: settings.siteName,
          logo: settings.logo || null,
          favicon: settings.favicon || null,
          primaryColor: settings.primaryColor,
          secondaryColor: settings.secondaryColor,
          typography: settings.typography,
          borderRadius: settings.borderRadius,
          spacingScale: settings.spacingScale,
        },
        sections: buildSections(),
      });
      setSuccessMessage('Cambios guardados en el borrador.');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar el tema.');
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
      await client.publishTheme(accessToken);
      setSuccessMessage('Tema publicado — el storefront ya refleja estos cambios.');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo publicar el tema.');
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleRestore(versionNumber: number) {
    if (!accessToken) return;
    setError(null);
    setSuccessMessage(null);
    try {
      await client.restoreThemeVersion(accessToken, versionNumber);
      setSuccessMessage(`Versión ${versionNumber} restaurada en el borrador (recuerda publicar).`);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo restaurar la versión.');
    }
  }

  function addFooterColumn() {
    setFooter((prev) => ({
      ...prev,
      columns: [...prev.columns, { title: 'Nueva columna', links: [] }],
    }));
  }

  function removeFooterColumn(index: number) {
    setFooter((prev) => ({ ...prev, columns: prev.columns.filter((_, i) => i !== index) }));
  }

  function updateFooterColumn(index: number, patch: Partial<FooterColumnForm>) {
    setFooter((prev) => ({
      ...prev,
      columns: prev.columns.map((column, i) => (i === index ? { ...column, ...patch } : column)),
    }));
  }

  function addFooterLink(columnIndex: number) {
    setFooter((prev) => ({
      ...prev,
      columns: prev.columns.map((column, i) =>
        i === columnIndex
          ? { ...column, links: [...column.links, { label: 'Enlace', url: '/' }] }
          : column,
      ),
    }));
  }

  function updateFooterLink(
    columnIndex: number,
    linkIndex: number,
    patch: Partial<FooterLinkForm>,
  ) {
    setFooter((prev) => ({
      ...prev,
      columns: prev.columns.map((column, i) =>
        i === columnIndex
          ? {
              ...column,
              links: column.links.map((link, j) =>
                j === linkIndex ? { ...link, ...patch } : link,
              ),
            }
          : column,
      ),
    }));
  }

  function removeFooterLink(columnIndex: number, linkIndex: number) {
    setFooter((prev) => ({
      ...prev,
      columns: prev.columns.map((column, i) =>
        i === columnIndex
          ? { ...column, links: column.links.filter((_, j) => j !== linkIndex) }
          : column,
      ),
    }));
  }

  if (!isLoaded) return <p className="text-sm text-neutral-500">Cargando…</p>;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Tema del sitio</h1>
          <p className="text-sm text-neutral-500">
            Edita el borrador y publícalo cuando esté listo para el storefront.
          </p>
        </div>
        <Button onClick={() => void handlePublish()} isLoading={isPublishing}>
          Publicar
        </Button>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}
      {successMessage && <p className="text-success-600 text-sm">{successMessage}</p>}

      <form onSubmit={(event) => void handleSave(event)} className="flex flex-col gap-8">
        <section className="flex flex-col gap-4 rounded-md border border-neutral-200 p-4">
          <h2 className="text-sm font-semibold text-neutral-900">
            Identidad y tipografía (Color Picker / Typography Settings)
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <FormField label="Nombre del sitio" htmlFor="siteName">
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings((prev) => ({ ...prev, siteName: e.target.value }))}
              />
            </FormField>
            <FormField label="Logo (URL)" htmlFor="logo">
              <Input
                id="logo"
                value={settings.logo}
                onChange={(e) => setSettings((prev) => ({ ...prev, logo: e.target.value }))}
              />
            </FormField>
            <FormField label="Favicon (URL)" htmlFor="favicon">
              <Input
                id="favicon"
                value={settings.favicon}
                onChange={(e) => setSettings((prev) => ({ ...prev, favicon: e.target.value }))}
              />
            </FormField>
            <FormField label="Tipografía" htmlFor="typography">
              <Input
                id="typography"
                value={settings.typography}
                onChange={(e) => setSettings((prev) => ({ ...prev, typography: e.target.value }))}
              />
            </FormField>
            <FormField label="Color primario" htmlFor="primaryColor">
              <div className="flex items-center gap-2">
                <input
                  id="primaryColor"
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, primaryColor: e.target.value }))
                  }
                  className="h-9 w-12 rounded border border-neutral-300"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, primaryColor: e.target.value }))
                  }
                />
              </div>
            </FormField>
            <FormField label="Color secundario" htmlFor="secondaryColor">
              <div className="flex items-center gap-2">
                <input
                  id="secondaryColor"
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, secondaryColor: e.target.value }))
                  }
                  className="h-9 w-12 rounded border border-neutral-300"
                />
                <Input
                  value={settings.secondaryColor}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, secondaryColor: e.target.value }))
                  }
                />
              </div>
            </FormField>
            <FormField label="Radio de borde" htmlFor="borderRadius">
              <Input
                id="borderRadius"
                value={settings.borderRadius}
                onChange={(e) => setSettings((prev) => ({ ...prev, borderRadius: e.target.value }))}
              />
            </FormField>
            <FormField label="Escala de espaciado" htmlFor="spacingScale">
              <Input
                id="spacingScale"
                value={settings.spacingScale}
                onChange={(e) => setSettings((prev) => ({ ...prev, spacingScale: e.target.value }))}
              />
            </FormField>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-md border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Header Editor</h2>
            <label className="flex items-center gap-2 text-xs text-neutral-600">
              <input
                type="checkbox"
                checked={headerEnabled}
                onChange={(e) => setHeaderEnabled(e.target.checked)}
              />
              Sección activa
            </label>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={header.showSearch}
                onChange={(e) => setHeader((prev) => ({ ...prev, showSearch: e.target.checked }))}
              />
              Mostrar buscador
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={header.showAccountLink}
                onChange={(e) =>
                  setHeader((prev) => ({ ...prev, showAccountLink: e.target.checked }))
                }
              />
              Mostrar enlace de cuenta
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={header.sticky}
                onChange={(e) => setHeader((prev) => ({ ...prev, sticky: e.target.checked }))}
              />
              Header fijo (sticky)
            </label>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-md border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Footer Editor</h2>
            <label className="flex items-center gap-2 text-xs text-neutral-600">
              <input
                type="checkbox"
                checked={footerEnabled}
                onChange={(e) => setFooterEnabled(e.target.checked)}
              />
              Sección activa
            </label>
          </div>

          <FormField label="Texto de copyright" htmlFor="copyrightText">
            <Input
              id="copyrightText"
              value={footer.copyrightText}
              onChange={(e) => setFooter((prev) => ({ ...prev, copyrightText: e.target.value }))}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={footer.showNewsletter}
              onChange={(e) => setFooter((prev) => ({ ...prev, showNewsletter: e.target.checked }))}
            />
            Mostrar formulario de newsletter
          </label>

          <div className="flex flex-col gap-3">
            {footer.columns.map((column, columnIndex) => (
              <div
                key={columnIndex}
                className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={column.title}
                    onChange={(e) => updateFooterColumn(columnIndex, { title: e.target.value })}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeFooterColumn(columnIndex)}
                    className="text-danger-600 text-xs hover:underline"
                  >
                    Quitar columna
                  </button>
                </div>
                {column.links.map((link, linkIndex) => (
                  <div key={linkIndex} className="ml-4 flex items-center gap-2">
                    <Input
                      value={link.label}
                      onChange={(e) =>
                        updateFooterLink(columnIndex, linkIndex, { label: e.target.value })
                      }
                      placeholder="Etiqueta"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) =>
                        updateFooterLink(columnIndex, linkIndex, { url: e.target.value })
                      }
                      placeholder="/ruta"
                    />
                    <button
                      type="button"
                      onClick={() => removeFooterLink(columnIndex, linkIndex)}
                      className="text-danger-600 text-xs hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addFooterLink(columnIndex)}
                  className="text-brand-600 ml-4 self-start text-xs hover:underline"
                >
                  + Agregar enlace
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={addFooterColumn}
              className="self-start"
            >
              + Agregar columna
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-md border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Banner Manager (global)</h2>
            <label className="flex items-center gap-2 text-xs text-neutral-600">
              <input
                type="checkbox"
                checked={bannerEnabled}
                onChange={(e) => setBannerEnabled(e.target.checked)}
              />
              Sección activa
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <FormField label="Mensaje" htmlFor="bannerMessage">
              <Input
                id="bannerMessage"
                value={banner.message}
                onChange={(e) => setBanner((prev) => ({ ...prev, message: e.target.value }))}
              />
            </FormField>
            <FormField label="URL (opcional)" htmlFor="bannerUrl">
              <Input
                id="bannerUrl"
                value={banner.url}
                onChange={(e) => setBanner((prev) => ({ ...prev, url: e.target.value }))}
              />
            </FormField>
            <FormField label="Color de fondo" htmlFor="bannerColor">
              <input
                id="bannerColor"
                type="color"
                value={banner.backgroundColor}
                onChange={(e) =>
                  setBanner((prev) => ({ ...prev, backgroundColor: e.target.value }))
                }
                className="h-9 w-12 rounded border border-neutral-300"
              />
            </FormField>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={banner.dismissible}
                onChange={(e) => setBanner((prev) => ({ ...prev, dismissible: e.target.checked }))}
              />
              Descartable
            </label>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-md border border-neutral-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Layout</h2>
            <label className="flex items-center gap-2 text-xs text-neutral-600">
              <input
                type="checkbox"
                checked={layoutEnabled}
                onChange={(e) => setLayoutEnabled(e.target.checked)}
              />
              Sección activa
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Ancho de contenedor" htmlFor="containerWidth">
              <Input
                id="containerWidth"
                value={layout.containerWidth}
                onChange={(e) => setLayout((prev) => ({ ...prev, containerWidth: e.target.value }))}
              />
            </FormField>
            <FormField label="Estilo del header" htmlFor="headerStyle">
              <select
                id="headerStyle"
                value={layout.headerStyle}
                onChange={(e) =>
                  setLayout((prev) => ({
                    ...prev,
                    headerStyle: e.target.value as LayoutForm['headerStyle'],
                  }))
                }
                className="w-full rounded-md border border-neutral-300 px-2 py-2 text-sm"
              >
                <option value="standard">Estándar</option>
                <option value="centered">Centrado</option>
                <option value="minimal">Minimalista</option>
              </select>
            </FormField>
          </div>
        </section>

        <Button type="submit" isLoading={isSaving} className="self-start">
          Guardar borrador
        </Button>
      </form>

      <section className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Live Preview</h2>
        <div
          style={{
            fontFamily: settings.typography,
            borderRadius: settings.borderRadius,
          }}
          className="overflow-hidden border border-neutral-200"
        >
          {bannerEnabled && banner.message && (
            <div
              style={{ backgroundColor: banner.backgroundColor }}
              className="px-4 py-2 text-center text-sm text-white"
            >
              {banner.message}
            </div>
          )}
          <div
            style={{ backgroundColor: settings.primaryColor }}
            className="flex items-center justify-between px-4 py-3 text-white"
          >
            <span className="font-semibold">{settings.siteName}</span>
            {header.showSearch && <span className="text-xs opacity-80">🔍 Buscar</span>}
          </div>
          <div
            style={{ backgroundColor: settings.secondaryColor }}
            className="px-4 py-6 text-white"
          >
            <p className="text-sm opacity-90">Contenido del sitio…</p>
          </div>
          <div className="flex flex-wrap gap-6 bg-neutral-900 px-4 py-4 text-xs text-neutral-300">
            {footer.columns.map((column, index) => (
              <div key={index}>
                <p className="font-semibold text-white">{column.title}</p>
                <ul className="mt-1 flex flex-col gap-1">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>{link.label}</li>
                  ))}
                </ul>
              </div>
            ))}
            {footer.copyrightText && (
              <p className="w-full text-neutral-500">{footer.copyrightText}</p>
            )}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-900">Historial de versiones</h2>
        <ul className="flex flex-col gap-2">
          {versions.map((version) => (
            <li
              key={version.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 p-3 text-sm"
            >
              <span>
                Versión {version.versionNumber} — {version.snapshot.siteName} (
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
