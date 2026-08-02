import type { ThemeState } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';

import { env } from '../../config/env';

interface BannerConfig {
  message?: string;
  url?: string;
  backgroundColor?: string;
}

function findSection(state: ThemeState, key: string) {
  return state.sections.find((section) => section.section === key && section.enabled);
}

/** Aplica el tema publicado (spec 029 §12) como variables CSS globales y renderiza el banner global si está activo — consume `GET /theme` (caché pública, sin TTL, ver `ThemeCacheService`), mismo criterio de "un fetch por request de servidor" que `SiteNavigation` (028). */
export async function SiteTheme() {
  const client = new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });
  const theme = await client.getPublishedTheme().catch(() => null);

  if (!theme) return null;

  const { settings } = theme;
  const bannerSection = findSection(theme, 'BANNER');
  const banner = bannerSection?.config as BannerConfig | undefined;

  return (
    <>
      <style>
        {`:root {
          --color-primary: ${settings.primaryColor};
          --color-secondary: ${settings.secondaryColor};
          --font-family-theme: ${settings.typography};
          --border-radius-theme: ${settings.borderRadius};
          --spacing-scale-theme: ${settings.spacingScale};
        }`}
      </style>
      {banner?.message && (
        <div
          style={{ backgroundColor: banner.backgroundColor ?? settings.primaryColor }}
          className="px-4 py-2 text-center text-sm text-white"
        >
          {banner.url ? <a href={banner.url}>{banner.message}</a> : banner.message}
        </div>
      )}
    </>
  );
}
