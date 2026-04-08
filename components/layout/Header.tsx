'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingBag, Menu, X, Globe, ChevronDown } from 'lucide-react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { routing } from '@/i18n/routing';

const localeLabels: Record<string, string> = {
  en: 'EN',
  hy: 'ՀՅ',
  ru: 'RU',
};

interface HeaderProps {
  locale: string;
}

export default function Header({ locale }: HeaderProps) {
  const t = useTranslations('nav');
  const { totalItems } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close mobile menu when navigating to a new page
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
    if (langOpen) setLangOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/catalog', label: t('catalog') },
    { href: '/about', label: t('about') },
  ];

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
    setLangOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span
              className="text-2xl lg:text-3xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: '#e11d48' }}
            >
              MORENA
            </span>
            <span className="text-xs tracking-widest text-stone-400 uppercase hidden sm:block">
              Cosmetics
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-stone-600 hover:text-rose-600 transition-colors relative after:absolute after:-bottom-0.5 after:left-0 after:right-0 after:h-0.5 after:bg-rose-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-rose-600 transition-colors px-2 py-1 rounded"
              >
                <Globe size={15} />
                <span>{localeLabels[locale] || locale.toUpperCase()}</span>
                <ChevronDown size={13} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-stone-100 py-1 min-w-20 z-50">
                  {routing.locales.map((l) => (
                    <button
                      key={l}
                      onClick={() => switchLocale(l)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-rose-50 hover:text-rose-600 transition-colors ${
                        l === locale ? 'text-rose-600 font-medium bg-rose-50' : 'text-stone-600'
                      }`}
                    >
                      {localeLabels[l]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-stone-600 hover:text-rose-600 transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag size={22} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {/* Hamburger */}
            <button
              className="md:hidden p-2 text-stone-600 hover:text-rose-600 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-stone-100 shadow-lg animate-fade-in">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-base font-medium text-stone-700 hover:text-rose-600 hover:bg-rose-50 px-3 py-2.5 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-stone-100 mt-2 pt-3 flex gap-2">
              {routing.locales.map((l) => (
                <button
                  key={l}
                  onClick={() => switchLocale(l)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                    l === locale
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'border-stone-200 text-stone-600 hover:border-rose-400 hover:text-rose-600'
                  }`}
                >
                  {localeLabels[l]}
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
