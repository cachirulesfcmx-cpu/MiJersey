import type { RenderedNavigationItem } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

import { env } from '../../config/env';

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

const HEADER_LINK_CLASS = 'tf-navlink';
const FOOTER_LINK_CLASS = 'text-sm transition-colors';
const FOOTER_LINK_STYLE = { color: 'var(--tf-text-muted)' };

/** Links de utilidad del header que no dependen del menú publicable (028) — siempre presentes para que el header nunca se sienta "vacío" si todavía no hay categorías cargadas ahí. */
const HEADER_STATIC_LINKS = [
  { href: '/brands', label: 'Marcas' },
  { href: '/search', label: 'Buscar' },
];

/** Estructura fija del footer (secciones + copy) — los destinos SÍ son reales (existen como rutas en apps/web), a diferencia del footer anterior que solo repetía el menú del header. */
const FOOTER_SHOP_LINKS = [
  { href: '/brands', label: 'Marcas' },
  { href: '/search', label: 'Todos los productos' },
];
const FOOTER_ACCOUNT_LINKS = [
  { href: '/account', label: 'Mi cuenta' },
  { href: '/account/orders', label: 'Mis pedidos' },
  { href: '/wishlist', label: 'Lista de deseos' },
  { href: '/cart', label: 'Carrito' },
];
const FOOTER_HELP_LINKS = [
  { href: '/account/support', label: 'Soporte' },
  { href: '/track', label: 'Rastrear pedido' },
];

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

function StaticLink({
  href,
  label,
  className,
  style,
}: {
  href: string;
  label: string;
  className: string;
  style?: CSSProperties;
}) {
  return (
    <Link href={href} className={className} style={style}>
      {label}
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

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="tf-footer-col-title tf-caption">{title}</p>
      <ul className="tf-footer-links">{children}</ul>
    </div>
  );
}

/**
 * Consume `GET /navigation/render/:location` (spec 028 §7/§8) — el header combina el menú
 * dinámico publicado (categorías reales, spec 028) con enlaces estáticos de utilidad
 * (Marcas/Buscar) que siempre están presentes. El footer (029) ya no depende de que exista
 * un menú publicado: tiene una estructura fija de columnas con destinos reales del storefront
 * (cuenta, pedidos, ayuda) más el menú dinámico cuando existe.
 * Header y footer usan el sistema de diseño "Continuum" (apps/web/src/styles/theme-framework.css).
 */
export async function SiteNavigation({ location }: { location: string }) {
  const client = new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });
  const items = await client.renderNavigationMenu(location).catch(() => []);
  const isHeader = location === 'header';

  if (isHeader) {
    return (
      <header className="tf-navbar" style={{ borderBottomColor: 'var(--tf-border)' }}>
        <div className="tf-container flex items-center justify-between gap-4">
          <Link href="/" className="font-display text-xl uppercase tracking-wide">
            MiJersey
          </Link>
          <nav aria-label="Navegación principal">
            <ul className="tf-navbar-links">
              {items.map((item) => (
                <TopLevelItem key={item.id} item={item} isHeader />
              ))}
              {HEADER_STATIC_LINKS.map((link) => (
                <li key={link.href}>
                  <StaticLink href={link.href} label={link.label} className={HEADER_LINK_CLASS} />
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <footer className="tf-footer">
      <div className="tf-container flex flex-col gap-12">
        <div className="tf-footer-grid">
          <div className="flex flex-col gap-3">
            <span className="font-display text-lg uppercase tracking-wide">MiJersey</span>
            <p className="tf-small max-w-xs" style={{ color: 'var(--tf-text-muted)' }}>
              Tu tienda de jerseys — encuentra tu equipo, tu liga y tu número favorito.
            </p>
          </div>

          <FooterColumn title="Tienda">
            {items.map((item) => (
              <li key={item.id}>
                <NavLink item={item} isHeader={false} />
              </li>
            ))}
            {FOOTER_SHOP_LINKS.map((link) => (
              <li key={link.href}>
                <StaticLink
                  href={link.href}
                  label={link.label}
                  className={FOOTER_LINK_CLASS}
                  style={FOOTER_LINK_STYLE}
                />
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Cuenta">
            {FOOTER_ACCOUNT_LINKS.map((link) => (
              <li key={link.href}>
                <StaticLink
                  href={link.href}
                  label={link.label}
                  className={FOOTER_LINK_CLASS}
                  style={FOOTER_LINK_STYLE}
                />
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title="Ayuda">
            {FOOTER_HELP_LINKS.map((link) => (
              <li key={link.href}>
                <StaticLink
                  href={link.href}
                  label={link.label}
                  className={FOOTER_LINK_CLASS}
                  style={FOOTER_LINK_STYLE}
                />
              </li>
            ))}
          </FooterColumn>
        </div>

        <p className="tf-caption" style={{ color: 'var(--tf-text-faint)' }}>
          © {new Date().getFullYear()} MiJersey. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
