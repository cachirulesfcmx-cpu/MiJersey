'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { PromotionCountdownBar } from '../promotions/PromotionCountdownBar';

/** El framework de demostración ("Continuum", en /theme-framework) es un sistema de diseño aislado, no una página más de la tienda — no debe mezclarse con el header/footer/carrito reales de MiJersey. `header`/`footer`/`cart`/`consent` llegan ya renderizados desde el layout raíz (Server Component) porque `SiteNavigation` es async y no puede importarse dentro de un Client Component. `PromotionCountdownBar` sí se importa directo aquí (no como prop) porque no es async: se autoalimenta con `useEffect` en el cliente. */
const ISOLATED_ROUTE_PREFIX = '/theme-framework';

export function SiteChrome({
  header,
  footer,
  cart,
  consent,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  cart: ReactNode;
  consent: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isIsolated = pathname?.startsWith(ISOLATED_ROUTE_PREFIX) ?? false;

  if (isIsolated) {
    return <>{children}</>;
  }

  return (
    <>
      <PromotionCountdownBar />
      {header}
      {children}
      {footer}
      {cart}
      {consent}
    </>
  );
}
