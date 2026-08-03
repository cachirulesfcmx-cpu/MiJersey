import type { RenderedNavigationItem } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';
import Link from 'next/link';

import { env } from '../../config/env';

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

const HEADER_LINK_CLASS = 'tf-navlink';
const FOOTER_LINK_CLASS = 'text-sm transition-colors';
const FOOTER_LINK_STYLE = { color: 'var(--tf-text-muted)' };

function NavLink({ item, isHeader }: { item: RenderedNavigationItem; isHeader: boolean }) {
  const className = isHeader ? HEADER_LINK_CLASS : FOOTER_LINK_CLASS;
  const style = isHeader ? undefined : FOOTER_LINK_STYLE;

  if (isExternal(item.href)) {
    return (
      <a
        href={item.href}
        target={item.openInNewTab ? '_blank' : undefined}
        rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
        className={className}
        style={style}
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
      style={style}
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
          className={`site-nav-dropdown invisible absolute left-0 top-full z-10 mt-2 rounded-2xl p-4 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 ${
            isMegaMenu ? 'flex gap-8' : 'flex min-w-[180px] flex-col gap-2'
          }`}
        >
          {isMegaMenu
            ? item.children.map((column) => (
                <div key={column.id} className="flex flex-col gap-2">
                  <span className="tf-caption" style={{ color: 'var(--tf-text-faint)' }}>
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
 * Header y footer usan el sistema de diseño "Continuum" (apps/web/src/styles/theme-framework.css):
 * navbar clara con blur, wordmark sobrio y footer en superficie tenue — mobile-first, el menú
 * completo solo aparece a partir de `md` (en móvil queda el wordmark + carrito).
 */
export async function SiteNavigation({ location }: { location: string }) {
  const client = new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });
  const items = await client.renderNavigationMenu(location).catch(() => []);
  const isHeader = location === 'header';

  if (isHeader) {
    return (
      <header className="tf-navbar" style={{ borderBottomColor: 'var(--tf-border)' }}>
        <div className="tf-container flex items-center justify-between gap-4">
          <Link href="/" className="tf-h3" style={{ fontSize: '1.375rem' }}>
            MiJersey
          </Link>
          {items.length > 0 && (
            <nav aria-label="Navegación principal">
              <ul className="tf-navbar-links">
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
    <footer className="tf-footer">
      <nav className="tf-container" aria-label="Navegación (footer)">
        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 sm:justify-start">
          {items.map((item) => (
            <TopLevelItem key={item.id} item={item} isHeader={false} />
          ))}
        </ul>
      </nav>
    </footer>
  );
}
