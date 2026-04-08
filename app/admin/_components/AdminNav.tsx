'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingBag, Mail, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

const NAV = [
  { href: '/admin',          label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products',   icon: Package },
  { href: '/admin/orders',   label: 'Orders',     icon: ShoppingBag },
  { href: '/admin/contacts', label: 'Contacts',   icon: Mail },
];

export default function AdminNav({ email }: { email?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-dvh bg-stone-900 flex flex-col fixed left-0 top-0">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-stone-800">
        <p className="text-white font-bold text-lg tracking-tight">Cosmo Admin</p>
        <p className="text-stone-500 text-xs mt-0.5 truncate">{email}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-rose-600 text-white'
                  : 'text-stone-400 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-stone-800">
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
