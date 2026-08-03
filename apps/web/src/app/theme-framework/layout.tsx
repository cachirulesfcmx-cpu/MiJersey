import type { Metadata } from 'next';

import { ThemeFrameworkShell } from '../../components/theme-framework/ThemeFrameworkShell';

export const metadata: Metadata = {
  title: 'Continuum — Theme Framework',
  description:
    'Sistema de diseño modular, minimalista y configurable: tokens, componentes y motion listos para cualquier marca.',
  robots: { index: false, follow: false },
};

export default function ThemeFrameworkLayout({ children }: { children: React.ReactNode }) {
  return <ThemeFrameworkShell>{children}</ThemeFrameworkShell>;
}
