'use client';

import { Button } from '@mijersey/ui';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { useAuth } from '../../providers/auth-provider';

interface NavItem {
  href: string;
  label: string;
  permission?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', permission: 'admin:access' },
  { href: '/home', label: 'Home', permission: 'admin:access' },
  { href: '/products', label: 'Productos', permission: 'admin:access' },
  { href: '/categories', label: 'Categorías', permission: 'admin:access' },
  { href: '/collections', label: 'Colecciones', permission: 'admin:access' },
  { href: '/attributes', label: 'Atributos', permission: 'admin:access' },
  { href: '/brands', label: 'Marcas', permission: 'admin:access' },
  { href: '/warehouses', label: 'Almacenes', permission: 'admin:access' },
  { href: '/inventory', label: 'Inventario', permission: 'admin:access' },
  { href: '/media', label: 'Media', permission: 'admin:access' },
  { href: '/search', label: 'Búsqueda', permission: 'admin:access' },
  { href: '/coupons', label: 'Cupones', permission: 'admin:access' },
  { href: '/redirects', label: 'Redirecciones', permission: 'admin:access' },
  { href: '/users', label: 'Usuarios', permission: 'identity:manage' },
  { href: '/roles', label: 'Roles', permission: 'admin:access' },
  { href: '/audit-log', label: 'Auditoría', permission: 'admin:access' },
  { href: '/profile', label: 'Perfil' },
];

const BREADCRUMB_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/home': 'Home',
  '/products': 'Productos',
  '/categories': 'Categorías',
  '/collections': 'Colecciones',
  '/attributes': 'Atributos',
  '/brands': 'Marcas',
  '/warehouses': 'Almacenes',
  '/inventory': 'Inventario',
  '/media': 'Media',
  '/search': 'Búsqueda',
  '/coupons': 'Cupones',
  '/redirects': 'Redirecciones',
  '/users': 'Usuarios',
  '/roles': 'Roles',
  '/audit-log': 'Auditoría',
  '/profile': 'Perfil',
};

const SIDEBAR_STORAGE_KEY = 'mijersey-admin-sidebar-collapsed';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, hasPermission, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    setIsSidebarCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true');
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!user || !hasPermission('admin:access')) {
      router.replace('/login');
    }
  }, [isLoading, user, hasPermission, router]);

  function toggleSidebar() {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  if (isLoading || !user || !hasPermission('admin:access')) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-400">
        Cargando…
      </div>
    );
  }

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );
  const breadcrumbLabel = BREADCRUMB_LABELS[pathname] ?? '';

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside
        className={`flex flex-col border-r border-neutral-200 bg-white transition-all ${isSidebarCollapsed ? 'w-16' : 'w-56'}`}
      >
        <div className="flex h-14 items-center justify-center border-b border-neutral-200 px-2 text-sm font-semibold text-neutral-900">
          {isSidebarCollapsed ? 'MJ' : 'MiJersey Admin'}
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="Navegación principal">
          {visibleNavItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {isSidebarCollapsed ? item.label.slice(0, 1) : item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          className="border-t border-neutral-200 p-3 text-xs text-neutral-500 hover:bg-neutral-100"
        >
          {isSidebarCollapsed ? '»' : '« Colapsar'}
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-6">
          <p className="text-sm text-neutral-500" aria-live="polite">
            {breadcrumbLabel && <span className="text-neutral-900">{breadcrumbLabel}</span>}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-600">
              {user.firstName} {user.lastName}
            </span>
            <Button variant="ghost" onClick={() => void handleLogout()}>
              Cerrar sesión
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
