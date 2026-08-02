import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { CartLauncher } from '../components/cart/CartLauncher';
import { SiteNavigation } from '../components/navigation/SiteNavigation';
import { SiteTheme } from '../components/theme/SiteTheme';
import { ConsentBanner } from '../components/tracking/ConsentBanner';
import { env } from '../config/env';
import { AuthProvider } from '../providers/auth-provider';
import { CartProvider } from '../providers/cart-provider';
import { WishlistProvider } from '../providers/wishlist-provider';

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
    <html lang="es">
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
