'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Mail,
  LogOut,
  X,
  ArrowRightFromLine
} from 'lucide-react';
import { adminSignOut } from '../_actions/auth';

const NAV = [
  { href: '/admin', label: 'Панель', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Товары', icon: Package },
  { href: '/admin/orders', label: 'Заказы', icon: ShoppingBag },
  { href: '/admin/contacts', label: 'Обращения', icon: Mail },
];

export default function AdminNav({ email }: { email?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-22 -left-3 z-50 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-stone-900 text-white shadow-lg"
        aria-label="Открыть меню админки"
      >
        <ArrowRightFromLine size={20} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Закрыть меню админки"
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-40"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 w-64 min-h-dvh bg-stone-900 flex flex-col
          transform transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Brand */}
        <div className="px-6 py-5 border-b border-stone-800 flex items-start justify-between gap-3">
          <div>
            <p className="text-white font-bold text-lg tracking-tight">Админка Morena</p>
            <p className="text-stone-500 text-xs mt-0.5 truncate">{email}</p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="md:hidden text-stone-400 hover:text-white"
            aria-label="Закрыть меню админки"
          >
            <X size={20} />
          </button>
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
          <form action={adminSignOut}>
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
            >
              <LogOut size={18} />
              Выйти
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}