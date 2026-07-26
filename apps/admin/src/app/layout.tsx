import './globals.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AuthProvider } from '../providers/auth-provider';

export const metadata: Metadata = {
  title: 'MiJersey Admin',
  description: 'Panel administrativo de MiJersey',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-white text-neutral-900 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
