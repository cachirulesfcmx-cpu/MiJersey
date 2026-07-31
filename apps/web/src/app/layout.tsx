import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { CartLauncher } from '../components/cart/CartLauncher';
import { AuthProvider } from '../providers/auth-provider';
import { CartProvider } from '../providers/cart-provider';
import { WishlistProvider } from '../providers/wishlist-provider';

export const metadata: Metadata = {
  title: 'MiJersey',
  description: 'Tienda MiJersey',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-white text-neutral-900 antialiased">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
              <CartLauncher />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
