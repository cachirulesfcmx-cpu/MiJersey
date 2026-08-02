'use client';

import type { SystemSetting } from '@mijersey/sdk';
import { ApiClient, ApiClientError } from '@mijersey/sdk';
import { Button, FormField, Input } from '@mijersey/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { env } from '../../../config/env';
import { useAuth } from '../../../providers/auth-provider';

interface GeneralForm {
  siteName: string;
  supportEmail: string;
  supportPhone: string;
}

interface RegionalForm {
  defaultDomain: string;
  defaultLanguage: string;
  defaultCurrency: string;
  timezone: string;
  locale: string;
}

interface SettingRow {
  key: string;
  value: string;
}

function defaultGeneral(): GeneralForm {
  return { siteName: '', supportEmail: '', supportPhone: '' };
}

function defaultRegional(): RegionalForm {
  return { defaultDomain: '', defaultLanguage: '', defaultCurrency: '', timezone: '', locale: '' };
}

function toRows(settings: SystemSetting[]): SettingRow[] {
  return settings.map((setting) => ({
    key: setting.key,
    value: typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value),
  }));
}

function parseValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function SettingsEditor({
  title,
  hint,
  rows,
  onChange,
}: {
  title: string;
  hint: string;
  rows: SettingRow[];
  onChange: (rows: SettingRow[]) => void;
}) {
  function addRow() {
    onChange([...rows, { key: '', value: '' }]);
  }

  function updateRow(index: number, patch: Partial<SettingRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <section className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
      <div>
        <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
        <p className="text-xs text-neutral-500">{hint}</p>
      </div>
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={row.key}
            onChange={(e) => updateRow(index, { key: e.target.value })}
            placeholder="clave (ej. tax.rate)"
            className="flex-1"
          />
          <Input
            value={row.value}
            onChange={(e) => updateRow(index, { value: e.target.value })}
            placeholder="valor (texto o JSON)"
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => removeRow(index)}
            className="text-danger-600 text-xs hover:underline"
          >
            Quitar
          </button>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={addRow} className="self-start">
        + Agregar
      </Button>
    </section>
  );
}

/** Site Configuration panel (spec 030 §6/§7): General/Domain/Language/Currency/Regional Settings editan `SiteConfiguration` en un único `PATCH /admin/settings/site`; Policy Manager e Integration Settings editan `SystemSetting` por categoría vía `PATCH /admin/settings/system`. A diferencia de Theme (029), no hay borrador/publicación ni historial: los cambios se validan y aplican de inmediato (spec §4). */
export default function SiteConfigurationPage() {
  const { accessToken } = useAuth();
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingRegional, setIsSavingRegional] = useState(false);
  const [isSavingPolicies, setIsSavingPolicies] = useState(false);
  const [isSavingIntegrations, setIsSavingIntegrations] = useState(false);

  const [general, setGeneral] = useState<GeneralForm>(defaultGeneral());
  const [regional, setRegional] = useState<RegionalForm>(defaultRegional());
  const [policyRows, setPolicyRows] = useState<SettingRow[]>([]);
  const [integrationRows, setIntegrationRows] = useState<SettingRow[]>([]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [config, policies, integrations] = await Promise.all([
        client.getSiteConfiguration(accessToken),
        client.listSystemSettings(accessToken, { category: 'policies' }),
        client.listSystemSettings(accessToken, { category: 'integrations' }),
      ]);
      setGeneral({
        siteName: config.siteName,
        supportEmail: config.supportEmail,
        supportPhone: config.supportPhone ?? '',
      });
      setRegional({
        defaultDomain: config.defaultDomain,
        defaultLanguage: config.defaultLanguage,
        defaultCurrency: config.defaultCurrency,
        timezone: config.timezone,
        locale: config.locale,
      });
      setPolicyRows(toRows(policies));
      setIntegrationRows(toRows(integrations));
      setIsLoaded(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo cargar la configuración.');
    }
  }, [client, accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSaveGeneral(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSavingGeneral(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await client.updateSiteConfiguration(accessToken, {
        siteName: general.siteName,
        supportEmail: general.supportEmail,
        ...(general.supportPhone ? { supportPhone: general.supportPhone } : {}),
      });
      setSuccessMessage('Información general actualizada.');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar.');
    } finally {
      setIsSavingGeneral(false);
    }
  }

  async function handleSaveRegional(event: React.FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSavingRegional(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await client.updateSiteConfiguration(accessToken, {
        defaultDomain: regional.defaultDomain,
        defaultLanguage: regional.defaultLanguage,
        defaultCurrency: regional.defaultCurrency,
        timezone: regional.timezone,
        locale: regional.locale,
      });
      setSuccessMessage('Configuración regional actualizada.');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar.');
    } finally {
      setIsSavingRegional(false);
    }
  }

  async function handleSaveSettings(
    rows: SettingRow[],
    category: string,
    setSaving: (value: boolean) => void,
  ) {
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await client.updateSystemSettings(accessToken, {
        settings: rows
          .filter((row) => row.key.trim().length > 0)
          .map((row) => ({ key: row.key, value: parseValue(row.value), category })),
      });
      setSuccessMessage('Ajustes guardados.');
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  if (!isLoaded) return <p className="text-sm text-neutral-500">Cargando…</p>;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Configuración del sitio</h1>
        <p className="text-sm text-neutral-500">
          Parámetros operativos, regionales y de integraciones globales de la tienda.
        </p>
      </div>

      {error && <p className="text-danger-600 text-sm">{error}</p>}
      {successMessage && <p className="text-success-600 text-sm">{successMessage}</p>}

      <form onSubmit={(event) => void handleSaveGeneral(event)} className="flex flex-col gap-4">
        <section className="flex flex-col gap-4 rounded-md border border-neutral-200 p-4">
          <h2 className="text-sm font-semibold text-neutral-900">General Settings</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField label="Nombre del sitio" htmlFor="siteName">
              <Input
                id="siteName"
                value={general.siteName}
                onChange={(e) => setGeneral((prev) => ({ ...prev, siteName: e.target.value }))}
              />
            </FormField>
            <FormField label="Correo de soporte" htmlFor="supportEmail">
              <Input
                id="supportEmail"
                type="email"
                value={general.supportEmail}
                onChange={(e) => setGeneral((prev) => ({ ...prev, supportEmail: e.target.value }))}
              />
            </FormField>
            <FormField label="Teléfono de soporte (opcional)" htmlFor="supportPhone">
              <Input
                id="supportPhone"
                value={general.supportPhone}
                onChange={(e) => setGeneral((prev) => ({ ...prev, supportPhone: e.target.value }))}
              />
            </FormField>
          </div>
          <Button type="submit" isLoading={isSavingGeneral} className="self-start">
            Guardar información general
          </Button>
        </section>
      </form>

      <form onSubmit={(event) => void handleSaveRegional(event)} className="flex flex-col gap-4">
        <section className="flex flex-col gap-4 rounded-md border border-neutral-200 p-4">
          <h2 className="text-sm font-semibold text-neutral-900">
            Domain Manager / Language / Currency / Regional Settings
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField label="Dominio principal" htmlFor="defaultDomain" hint="ej. mijersey.com">
              <Input
                id="defaultDomain"
                value={regional.defaultDomain}
                onChange={(e) =>
                  setRegional((prev) => ({ ...prev, defaultDomain: e.target.value }))
                }
              />
            </FormField>
            <FormField label="Idioma por defecto" htmlFor="defaultLanguage" hint="ej. es, es-MX">
              <Input
                id="defaultLanguage"
                value={regional.defaultLanguage}
                onChange={(e) =>
                  setRegional((prev) => ({ ...prev, defaultLanguage: e.target.value }))
                }
              />
            </FormField>
            <FormField
              label="Moneda por defecto"
              htmlFor="defaultCurrency"
              hint="ISO 4217, ej. MXN"
            >
              <Input
                id="defaultCurrency"
                value={regional.defaultCurrency}
                onChange={(e) =>
                  setRegional((prev) => ({ ...prev, defaultCurrency: e.target.value }))
                }
              />
            </FormField>
            <FormField label="Zona horaria" htmlFor="timezone" hint="ej. America/Mexico_City">
              <Input
                id="timezone"
                value={regional.timezone}
                onChange={(e) => setRegional((prev) => ({ ...prev, timezone: e.target.value }))}
              />
            </FormField>
            <FormField label="Configuración regional" htmlFor="locale" hint="BCP 47, ej. es-MX">
              <Input
                id="locale"
                value={regional.locale}
                onChange={(e) => setRegional((prev) => ({ ...prev, locale: e.target.value }))}
              />
            </FormField>
          </div>
          <Button type="submit" isLoading={isSavingRegional} className="self-start">
            Guardar configuración regional
          </Button>
        </section>
      </form>

      <SettingsEditor
        title="Policy Manager"
        hint="Políticas legales (términos, privacidad, devoluciones) como pares clave/valor."
        rows={policyRows}
        onChange={setPolicyRows}
      />
      <Button
        type="button"
        isLoading={isSavingPolicies}
        onClick={() => void handleSaveSettings(policyRows, 'policies', setIsSavingPolicies)}
        className="self-start"
      >
        Guardar políticas
      </Button>

      <SettingsEditor
        title="Integration Settings"
        hint="Integraciones globales (analítica, pasarelas, servicios externos) como pares clave/valor."
        rows={integrationRows}
        onChange={setIntegrationRows}
      />
      <Button
        type="button"
        isLoading={isSavingIntegrations}
        onClick={() =>
          void handleSaveSettings(integrationRows, 'integrations', setIsSavingIntegrations)
        }
        className="self-start"
      >
        Guardar integraciones
      </Button>
    </div>
  );
}
