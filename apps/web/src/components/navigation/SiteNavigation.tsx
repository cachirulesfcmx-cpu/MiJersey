import type { RenderedNavigationItem } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';
import Link from 'next/link';

import { env } from '../../config/env';

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

const HEADER_LINK_CLASS = 'text-sm font-medium text-white/80 transition-colors hover:text-white';
const FOOTER_LINK_CLASS = 'text-sm text-white/70 transition-colors hover:text-white';

function NavLink({ item, isHeader }: { item: RenderedNavigationItem; isHeader: boolean }) {
  const className = isHeader ? HEADER_LINK_CLASS : FOOTER_LINK_CLASS;

  if (isExternal(item.href)) {
    return (
      <a
        href={item.href}
        target={item.openInNewTab ? '_blank' : undefined}
        rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
        className={className}
      >
        {item.label}
      </a>
    );
  }
  return (
    <Link
      href={item.href}
      target={item.openInNewTab ? '_blank' : undefined}
      rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
      className={className}
    >
      {item.label}
    </Link>
  );
}

/** Ítem de nivel superior — si tiene hijos con hijos propios, se trata como mega menú (columnas); si solo tiene hijos de un nivel, como dropdown simple (spec 028 §2 "mega menús"). */
function TopLevelItem({ item, isHeader }: { item: RenderedNavigationItem; isHeader: boolean }) {
  const hasChildren = item.children.length > 0;
  const isMegaMenu = item.children.some((child) => child.children.length > 0);

  return (
    <li className="group relative">
      <NavLink item={item} isHeader={isHeader} />
      {hasChildren && (
        <div
          className={`bg-arena-800 invisible absolute left-0 top-full z-10 mt-2 rounded-xl border border-white/10 p-4 opacity-0 shadow-xl transition-opacity group-hover:visible group-hover:opacity-100 ${
            isMegaMenu ? 'flex gap-8' : 'flex min-w-[180px] flex-col gap-2'
          }`}
        >
          {isMegaMenu
            ? item.children.map((column) => (
                <div key={column.id} className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
                    {column.label}
                  </span>
                  {column.children.map((link) => (
                    <NavLink key={link.id} item={link} isHeader={isHeader} />
                  ))}
                </div>
              ))
            : item.children.map((child) => (
                <NavLink key={child.id} item={child} isHeader={isHeader} />
              ))}
        </div>
      )}
    </li>
  );
}

/**
 * Consume `GET /navigation/render/:location` (spec 028 §7/§8) — una ubicación
 * sin menú publicado no renderiza nada, en vez de mostrar un hueco vacío.
 * El header lleva el wordmark "MIJERSEY" en tipografía display sobre un
 * degradado violeta-magenta (tema "arena", inspirado en estética glitch/arcade
 * genérica, mobile-first: el menú completo solo aparece a partir de `md`,
 * en móvil solo queda el wordmark + carrito). El footer usa la misma paleta
 * oscura con una textura de puntos sutil (`bg-stardust`).
 */
export async function SiteNavigation({ location }: { location: string }) {
  const client = new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });
  const items = await client.renderNavigationMenu(location).catch(() => []);
  const isHeader = location === 'header';

  if (isHeader) {
    return (
      <header className="from-arena-950 via-arena-800 to-arena-700 sticky top-0 z-30 bg-gradient-to-r px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            href="/"
            className="font-display text-2xl uppercase tracking-wider text-white sm:text-3xl"
          >
            MiJersey
          </Link>
          {items.length > 0 && (
            <nav aria-label="Navegación principal" className="hidden md:block">
              <ul className="flex items-center gap-6">
                {items.map((item) => (
                  <TopLevelItem key={item.id} item={item} isHeader />
                ))}
              </ul>
            </nav>
          )}
        </div>
      </header>
    );
  }

  if (items.length === 0) return null;

  return (
    <footer className="bg-stardust bg-arena-950 px-4 py-10 sm:px-6">
      <nav className="mx-auto max-w-6xl" aria-label="Navegación (footer)">
        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 sm:justify-start">
          {items.map((item) => (
            <TopLevelItem key={item.id} item={item} isHeader={false} />
          ))}
        </ul>
      </nav>
    </footer>
  );
}
