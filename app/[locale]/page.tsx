import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import VideoHero from '@/components/home/VideoHero';
import ProductCarousel from '@/components/home/ProductCarousel';
import CategoryStrip from '@/components/home/CategoryStrip';
import ValuesStrip from '@/components/home/ValuesStrip';
import ContactForm from '@/components/home/ContactForm';
import { getFeaturedAndBestsellers } from '@/lib/db-products';
import { Locale } from '@/lib/types';
import { BASE_URL, buildPageMetadata, htmlLang } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.home' });

  return buildPageMetadata({
    locale,
    path: '',
    title: t('title'),
    description: t('description'),
    applyTitleTemplate: false,
  });
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'home.promo' });
  const { featured, bestsellers } = await getFeaturedAndBestsellers();

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    name: 'Morena Cosmetics',
    url: BASE_URL,
    inLanguage: htmlLang(locale),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/${locale}/catalog?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <VideoHero />

      <CategoryStrip locale={locale} />

      <ProductCarousel products={bestsellers} locale={l} titleKey="bestsellers" />

      <section className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #9f1239 0%, #e11d48 50%, #fb7185 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 0%, transparent 60%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="text-rose-200 text-sm tracking-widest uppercase font-medium mb-4">
            {t('eyebrow')}
          </p>
          <h2 className="text-white text-4xl sm:text-5xl font-bold mb-5" style={{ fontFamily: 'var(--font-display)' }}>
            {t('title')}
          </h2>
          <p className="text-rose-100 text-lg mb-8 max-w-xl mx-auto">
            {t('description')}
          </p>
          <Link
            href="/catalog"
            className="inline-block bg-white text-rose-700 font-bold px-10 py-4 rounded-full hover:bg-rose-50 active:scale-95 transition-all shadow-xl"
          >
            {t('cta')}
          </Link>
        </div>
      </section>

      <ProductCarousel products={featured} locale={l} titleKey="featured" />

      <ValuesStrip />

      <ContactForm />
    </>
  );
}
