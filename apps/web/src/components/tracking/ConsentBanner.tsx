'use client';

import { ApiClient } from '@mijersey/sdk';
import { useEffect, useMemo, useState } from 'react';

import { env } from '../../config/env';
import { getStoredConsent, grantedCategoriesFrom, setStoredConsent } from './consent-storage';
import { injectTrackingScript } from './inject-provider-scripts';

/** Consent Banner + activación de proveedores (033 §6/§4 "respetar el consentimiento del usuario antes de activar etiquetas cuando aplique") — se muestra solo si el visitante no eligió antes (persistido en `localStorage`, sin backend). Una vez elegido (o si ya había una elección guardada), inyecta los scripts de los proveedores ACTIVOS cuya categoría fue otorgada; "necessary" y los proveedores sin categoría (ej. Conversion API, que no corre en el navegador) siempre se consideran otorgados. */
export function ConsentBanner() {
  const client = useMemo(() => new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }), []);
  const [categories, setCategories] = useState<string[] | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const [{ categories: availableCategories }, providers] = await Promise.all([
          client.getTrackingConsentCategories(),
          client.getPublicTrackingProviders(),
        ]);
        if (cancelled) return;

        setCategories(availableCategories);

        const stored = getStoredConsent();
        if (!stored) {
          setVisible(true);
          return;
        }

        const granted = new Set(grantedCategoriesFrom(stored));
        granted.add('necessary');
        for (const provider of providers) {
          if (!provider.consentCategory || granted.has(provider.consentCategory)) {
            injectTrackingScript(provider);
          }
        }
      } catch {
        // sin proveedores/categorías disponibles (backend caído o sin configurar), el storefront sigue funcionando sin tracking
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [client]);

  function acceptAll() {
    const choice = Object.fromEntries((categories ?? []).map((category) => [category, true]));
    setStoredConsent(choice);
    setVisible(false);
    window.location.reload();
  }

  function rejectNonEssential() {
    setStoredConsent({ necessary: true });
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Preferencias de privacidad"
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 border-t border-neutral-200 bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-neutral-700">
        Usamos cookies para medir el uso del sitio y mejorar tu experiencia. Puedes aceptar todas o
        solo las necesarias.
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={rejectNonEssential}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          Solo necesarias
        </button>
        <button
          type="button"
          onClick={acceptAll}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800"
        >
          Aceptar todo
        </button>
      </div>
    </div>
  );
}
