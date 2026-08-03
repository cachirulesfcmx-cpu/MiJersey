import './globals.css';

import type { Metadata } from 'next';
import { Bebas_Neue } from 'next/font/google';
import type { ReactNode } from 'react';

import { CartLauncher } from '../components/cart/CartLauncher';
import { SiteNavigation } from '../components/navigation/SiteNavigation';
import { SiteTheme } from '../components/theme/SiteTheme';
import { ConsentBanner } from '../components/tracking/ConsentBanner';
import { env } from '../config/env';
import { AuthProvider } from '../providers/auth-provider';
import { CartProvider } from '../providers/cart-provider';
import { WishlistProvider } from '../providers/wishlist-provider';

/** Tipografía bold/condensada para titulares — refuerza la identidad "arena" del storefront sin depender del `--font-family-theme` editable en el admin (029), que sigue controlando la tipografía de cuerpo de texto vía `SiteTheme`. */
const displayFont = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'MiJersey',
  description: 'Tienda MiJersey',
  robots: { index: false, follow: false },
  metadataBase: new URL(env.NEXT_PUBLIC_WEB_URL),
};

/** Sin esto, el `fetch` de `SiteNavigation` usaría el cache-by-default de Next.js (indefinido) por encima de la caché ya invalidada de Navigation (028 §8) — mismo valor que su TTL en Redis para que ambas capas queden sincronizadas, mismo criterio que la Home (013). */
export const revalidate = 60;

/** Integración con Home (013)/CMS Pages (026)/Blog (027) sin cambios estructurales en esas páginas (spec 028 DoD): el menú de cada ubicación se resuelve una vez aquí y se reutiliza en todo el sitio. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={displayFont.variable}>
      <body className="bg-white text-neutral-900 antialiased">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <SiteTheme />
              <SiteNavigation location="header" />
              {children}
              <SiteNavigation location="footer" />
              <CartLauncher />
              <ConsentBanner />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
