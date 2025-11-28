'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const NAV_LINKS: Record<
  'ROLE_SUPERADMIN' | 'ROLE_ADMIN' | 'ROLE_WAITER',
  { label: string; href: string; exact?: boolean }[]
> = {
  ROLE_SUPERADMIN: [
    { label: 'Dashboard', href: '/superadmin/dashboard' },
    { label: 'Branches', href: '/superadmin/branches' },
    { label: 'Admins', href: '/superadmin/admins' },
    { label: 'Staff', href: '/superadmin/staff' },
  ],
  ROLE_ADMIN: [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Staff', href: '/admin/staff' },
    { label: 'Tables', href: '/admin/tables' },
    { label: 'Menu', href: '/admin/menu' },
  ],
  ROLE_WAITER: [],
};

const isActive = (pathname: string, href: string, exact = false) => {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const links = NAV_LINKS[user.role] ?? [];

  return (
    <aside className="fixed left-0 top-0 z-10 flex h-screen w-72 flex-col gap-6 overflow-y-auto border-r border-slate-200 bg-white px-4 py-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">Signed in as</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{user.email}</p>
        <p className="text-sm capitalize text-slate-500">
          {user.role.replace('ROLE_', '').toLowerCase()}
        </p>
        <p className="text-xs text-slate-400">
          {user.restaurantName ?? `Restaurant #${user.restaurantId}`}
          {user.branchId ? ` • Branch #${user.branchId}` : ''}
        </p>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const active = isActive(pathname, link.href, link.exact);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                active
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => logout()}
        className="mt-auto rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
      >
        Sign out
      </button>
    </aside>
  );
}

