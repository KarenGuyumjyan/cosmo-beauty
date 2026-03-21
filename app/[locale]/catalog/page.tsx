import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Locale } from '@/lib/types';
import ProductGrid from '@/components/catalog/ProductGrid';
import { getAllProducts } from '@/lib/db-products';
import { categories } from '@/lib/data';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'catalog' });
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function CatalogPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'catalog' });

  const products = await getAllProducts();
  const allSizes = [...new Set(products.map((p) => p.size))].sort();

  return (
    <div className="pt-20">
      {/* Page header */}
      <div
        className="relative py-16 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #fdf8f0 100%)' }}
      >
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #fecdd3 0%, transparent 60%)' }} />
        <div className="relative max-w-4xl mx-auto px-4">
          <p className="text-rose-600 text-xs tracking-widest uppercase font-semibold mb-3">Collection</p>
          <h1
            className="text-4xl sm:text-5xl font-bold text-stone-900 mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('title')}
          </h1>
          <p className="text-stone-500 text-lg max-w-xl mx-auto">{t('subtitle')}</p>
        </div>
      </div>

      <ProductGrid
        locale={locale as Locale}
        products={products}
        allSizes={allSizes}
        categories={categories}
      />
    </div>
  );
}
