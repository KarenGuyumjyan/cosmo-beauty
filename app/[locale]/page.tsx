import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import VideoHero from '@/components/home/VideoHero';
import ProductCarousel from '@/components/home/ProductCarousel';
import CategoryStrip from '@/components/home/CategoryStrip';
import ValuesStrip from '@/components/home/ValuesStrip';
import ContactForm from '@/components/home/ContactForm';
import { getFeaturedProducts, getBestsellers } from '@/lib/data';
import { Locale } from '@/lib/types';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home.hero' });
  return {
    title: 'Cosmo Beauty – ' + t('title'),
    description: t('subtitle'),
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const l = locale as Locale;
  const featured = getFeaturedProducts();
  const bestsellers = getBestsellers();

  return (
    <>
      {/* Hero video banner */}
      <VideoHero />

      {/* Category strip – auto-scrolling marquee */}
      <CategoryStrip locale={locale} />

      {/* Bestsellers carousel */}
      <ProductCarousel products={bestsellers} locale={l} titleKey="bestsellers" />

      {/* Banner CTA */}
      <section className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #9f1239 0%, #e11d48 50%, #fb7185 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 0%, transparent 60%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="text-rose-200 text-sm tracking-widest uppercase font-medium mb-4">Limited Offer</p>
          <h2 className="text-white text-4xl sm:text-5xl font-bold mb-5" style={{ fontFamily: 'var(--font-display)' }}>
            Up to 30% Off
          </h2>
          <p className="text-rose-100 text-lg mb-8 max-w-xl mx-auto">
            Discover our seasonal sale on premium skincare and makeup collections.
          </p>
          <a
            href={`/${locale}/catalog`}
            className="inline-block bg-white text-rose-700 font-bold px-10 py-4 rounded-full hover:bg-rose-50 active:scale-95 transition-all shadow-xl"
          >
            Shop the Sale
          </a>
        </div>
      </section>

      {/* Featured products carousel */}
      <ProductCarousel products={featured} locale={l} titleKey="featured" />

      {/* Values strip */}
      <ValuesStrip />

      {/* Contact / call-back form */}
      <ContactForm />
    </>
  );
}
