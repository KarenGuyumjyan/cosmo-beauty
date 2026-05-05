'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');

  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <span
                className="text-2xl font-bold text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                MORENA COSMETICS
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-stone-400">{t('description')}</p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href="https://www.instagram.com/morena_cosmetics__/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:bg-rose-600 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:bg-rose-600 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={16} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:bg-rose-600 hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={16} />
              </a>
              {/* TikTok icon (lucide doesn't have one) */}
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-stone-800 flex items-center justify-center text-stone-400 hover:bg-rose-600 hover:text-white transition-colors"
                aria-label="TikTok"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              {t('links')}
            </h3>
            <ul className="space-y-2.5">
              {[
                { href: '/', label: nav('home') },
                { href: '/catalog', label: nav('catalog') },
                { href: '/cart', label: nav('cart') },
                { href: '/about', label: nav('about') },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-stone-400 hover:text-rose-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              {t('contact')}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-stone-400">
                <Mail size={15} className="mt-0.5 shrink-0 text-rose-400" />
                <a href="mailto:hello@cosmo.beauty" className="hover:text-rose-400 transition-colors">
                  hello@cosmo.beauty
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-stone-400">
                <Phone size={15} className="mt-0.5 shrink-0 text-rose-400" />
                <a href="tel:+37411234567" className="hover:text-rose-400 transition-colors">
                  +374 11 234 567
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-stone-400">
                <MapPin size={15} className="mt-0.5 shrink-0 text-rose-400" />
                <span>15 Baghramyan Ave, Yerevan</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-stone-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <span>© {new Date().getFullYear()} Morena Cosmetics. {t('rights')}</span>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-rose-400 transition-colors">
              {t('privacy')}
            </Link>
            <Link href="/about" className="hover:text-rose-400 transition-colors">
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
