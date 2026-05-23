import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { BASE_URL, buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.about' });
  return buildPageMetadata({
    locale,
    path: '/about',
    title: t('title'),
    description: t('description'),
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  const tSeo = await getTranslations({ locale, namespace: 'seo.about' });

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${BASE_URL}/#organization`,
    name: 'Morena Cosmetics',
    url: BASE_URL,
    telephone: '+37411234567',
    email: 'morena_studio@mail.ru',
    description: tSeo('description'),
    address: {
      '@type': 'PostalAddress',
      streetAddress: '15 Baghramyan Ave',
      addressLocality: 'Yerevan',
      addressCountry: 'AM',
    },
    sameAs: [
      'https://instagram.com',
      'https://facebook.com',
      'https://tiktok.com',
    ],
    priceRange: '₽₽',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
    <div className="pt-10">
      {/* Hero */}
      <section
        className="relative py-24 overflow-hidden text-center"
        style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #fdf8f0 60%, #fef3e2 100%)' }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-rose-200/30 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4">
          <p className="text-rose-600 text-xs tracking-widest uppercase font-semibold mb-4">{t('subtitle')}</p>
          <h1
            className="text-4xl sm:text-6xl font-bold text-stone-900 mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('title')}
          </h1>
          <p className="text-stone-600 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">
            {t('story')}
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-rose-600 text-xs tracking-widest uppercase font-semibold mb-3">{t('mission.title')}</p>
              <h2
                className="text-3xl sm:text-4xl font-bold text-stone-900 mb-5"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('mission.heading')}
              </h2>
              <p className="text-stone-600 leading-relaxed text-lg">{t('mission.text')}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'quality', icon: '✨', color: 'bg-rose-50 border-rose-100' },
                { key: 'sustainability', icon: '🌿', color: 'bg-green-50 border-green-100' },
                { key: 'inclusivity', icon: '🌍', color: 'bg-sky-50 border-sky-100' },
                { key: 'innovation', icon: '🔬', color: 'bg-amber-50 border-amber-100' },
              ].map(({ key, icon, color }) => (
                <div key={key} className={`${color} border rounded-2xl p-5 text-center`}>
                  <span className="text-3xl mb-3 block">{icon}</span>
                  <p className="text-sm font-semibold text-stone-700">
                    {t(`values.${key}` as Parameters<typeof t>[0])}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Social */}
      <section className="py-20 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact */}
            <div>
              <h2
                className="text-2xl sm:text-3xl font-bold mb-8"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('contact.title')}
              </h2>
              <div className="space-y-5">
                <a
                  href="mailto:morena_studio@mail.ru"
                  className="flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-rose-600/20 flex items-center justify-center text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-0.5">{t('contact.emailLabel')}</p>
                    <p className="text-stone-300 group-hover:text-rose-300 transition-colors">{t('contact.email')}</p>
                  </div>
                </a>
                <a href="tel:+37411234567" className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-rose-600/20 flex items-center justify-center text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-0.5">{t('contact.phoneLabel')}</p>
                    <p className="text-stone-300 group-hover:text-rose-300 transition-colors">{t('contact.phone')}</p>
                  </div>
                </a>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-600/20 flex items-center justify-center text-rose-400 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-0.5">{t('contact.addressLabel')}</p>
                    <p className="text-stone-300">{t('contact.address')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social */}
            <div>
              <h2
                className="text-2xl sm:text-3xl font-bold mb-8"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {t('social.title')}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Instagram size={22} />, label: 'Instagram', href: 'https://www.instagram.com/morena_cosmetics__/', color: 'hover:bg-pink-600' },
                  {
                    icon: (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06Z" />
                      </svg>
                    ),
                    label: 'TikTok',
                    href: 'https://www.tiktok.com/@morena_cosmetics_',
                    color: 'hover:bg-stone-700',
                  },
                ].map(({ icon, label, href, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 bg-stone-800 ${color} px-5 py-4 rounded-2xl transition-colors group`}
                  >
                    <span className="text-stone-400 group-hover:text-white transition-colors">{icon}</span>
                    <span className="font-medium text-stone-300 group-hover:text-white transition-colors">{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
