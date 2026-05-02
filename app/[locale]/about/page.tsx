import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Instagram, Facebook, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://morena-cosmetics.ru';

type Props = { params: Promise<{ locale: string }> };

const ABOUT_DESCRIPTIONS: Record<string, string> = {
  ru: 'Узнайте о Morena Cosmetics — бренде премиальной косметики. Наша миссия: доступная роскошь и уверенность в красоте для каждого.',
  en: 'Learn about Morena Cosmetics — a premium beauty brand. Our mission: accessible luxury and confidence through ethically-sourced makeup.',
  hy: 'Ծանոթացեք Morena Cosmetics-ին — պրեմիում կոսմետիկայի ապրանքանիշ, որի առաքելությունն է մատչելի շքեղությունն ու վստահությունն ամենքի համար։',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  const title = t('title');
  const description = ABOUT_DESCRIPTIONS[locale] ?? ABOUT_DESCRIPTIONS.en;
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${locale}/about` },
    openGraph: { title, description, url: `${BASE_URL}/${locale}/about` },
    twitter: { card: 'summary_large_image', title, description },
  };
}

const blogPosts = [
  {
    id: 1,
    title: 'The Ultimate Guide to Building a Skincare Routine',
    date: 'March 5, 2026',
    category: 'Skincare',
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80',
    excerpt: 'Whether you\'re a skincare novice or a seasoned enthusiast, building the right routine can transform your skin.',
  },
  {
    id: 2,
    title: 'Spring Makeup Trends You Need to Try',
    date: 'February 20, 2026',
    category: 'Makeup',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80',
    excerpt: 'From dewy skin to bold lips, here\'s what\'s trending this spring season.',
  },
  {
    id: 3,
    title: 'How to Choose the Right Fragrance for Your Personality',
    date: 'February 10, 2026',
    category: 'Fragrance',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=600&q=80',
    excerpt: 'Scent is deeply personal. Here\'s how to find the fragrance that truly speaks to you.',
  },
];

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  const tBlog = await getTranslations({ locale, namespace: 'about.blog' });

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${BASE_URL}/#organization`,
    name: 'Morena Cosmetics',
    url: BASE_URL,
    telephone: '+37411234567',
    email: 'hello@cosmo.beauty',
    description: ABOUT_DESCRIPTIONS[locale] ?? ABOUT_DESCRIPTIONS.en,
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
                Beauty with Purpose
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

      {/* Blog */}
      <section className="py-20" style={{ background: '#fdf8f0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-rose-600 text-xs tracking-widest uppercase font-semibold mb-3">{tBlog('subtitle')}</p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-stone-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {tBlog('title')}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl overflow-hidden border border-stone-100 hover:shadow-xl hover:shadow-rose-100/50 transition-all group"
              >
                <div className="relative h-52 overflow-hidden bg-stone-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 bg-white text-rose-600 text-xs font-bold px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-xs text-stone-400 mb-2">{post.date}</p>
                  <h3 className="font-bold text-stone-800 mb-2 leading-snug group-hover:text-rose-700 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-stone-500 leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
                  <button className="text-sm font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors">
                    {tBlog('readMore')} <ExternalLink size={13} />
                  </button>
                </div>
              </article>
            ))}
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
                  href="mailto:hello@cosmo.beauty"
                  className="flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-rose-600/20 flex items-center justify-center text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-0.5">Email</p>
                    <p className="text-stone-300 group-hover:text-rose-300 transition-colors">{t('contact.email')}</p>
                  </div>
                </a>
                <a href="tel:+37411234567" className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl bg-rose-600/20 flex items-center justify-center text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-0.5">Phone</p>
                    <p className="text-stone-300 group-hover:text-rose-300 transition-colors">{t('contact.phone')}</p>
                  </div>
                </a>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-600/20 flex items-center justify-center text-rose-400 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wider mb-0.5">Address</p>
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
                  { icon: <Instagram size={22} />, label: 'Instagram', href: 'https://instagram.com', color: 'hover:bg-pink-600' },
                  { icon: <Facebook size={22} />, label: 'Facebook', href: 'https://facebook.com', color: 'hover:bg-blue-600' },
                  {
                    icon: (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06Z" />
                      </svg>
                    ),
                    label: 'TikTok',
                    href: 'https://tiktok.com',
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
