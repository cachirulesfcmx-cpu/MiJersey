import type { RenderedNavigationItem } from '@mijersey/sdk';
import { ApiClient } from '@mijersey/sdk';
import Link from 'next/link';

import { env } from '../../config/env';

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

function NavLink({ item }: { item: RenderedNavigationItem }) {
  if (isExternal(item.href)) {
    return (
      <a
        href={item.href}
        target={item.openInNewTab ? '_blank' : undefined}
        rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
        className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
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
      className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
    >
      {item.label}
    </Link>
  );
}

/** Ítem de nivel superior — si tiene hijos con hijos propios, se trata como mega menú (columnas); si solo tiene hijos de un nivel, como dropdown simple (spec 028 §2 "mega menús"). */
function TopLevelItem({ item }: { item: RenderedNavigationItem }) {
  const hasChildren = item.children.length > 0;
  const isMegaMenu = item.children.some((child) => child.children.length > 0);

  return (
    <li className="group relative">
      <NavLink item={item} />
      {hasChildren && (
        <div
          className={`invisible absolute left-0 top-full z-10 mt-2 rounded-md border border-neutral-200 bg-white p-4 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 ${
            isMegaMenu ? 'flex gap-8' : 'flex min-w-[180px] flex-col gap-2'
          }`}
        >
          {isMegaMenu
            ? item.children.map((column) => (
                <div key={column.id} className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase text-neutral-500">
                    {column.label}
                  </span>
                  {column.children.map((link) => (
                    <NavLink key={link.id} item={link} />
                  ))}
                </div>
              ))
            : item.children.map((child) => <NavLink key={child.id} item={child} />)}
        </div>
      )}
    </li>
  );
}

/** Consume `GET /navigation/render/:location` (spec 028 §7/§8) — una ubicación sin menú publicado no renderiza nada, en vez de mostrar un hueco vacío con borde. */
export async function SiteNavigation({ location }: { location: string }) {
  const client = new ApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL });
  const items = await client.renderNavigationMenu(location).catch(() => []);

  if (items.length === 0) return null;

  return (
    <nav
      className="border-b border-neutral-200 bg-white px-6 py-3"
      aria-label={`Navegación (${location})`}
    >
      <ul className="mx-auto flex max-w-6xl items-center gap-6">
        {items.map((item) => (
          <TopLevelItem key={item.id} item={item} />
        ))}
      </ul>
    </nav>
  );
}
