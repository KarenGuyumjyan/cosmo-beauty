import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Locale } from '@/lib/types';
import ProductGrid from '@/components/catalog/ProductGrid';
import { getAllProducts } from '@/lib/db-products';
import { categories } from '@/lib/data';
import { BASE_URL, buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.catalog' });
  return buildPageMetadata({
    locale,
    path: '/catalog',
    title: t('title'),
    description: t('description'),
  });
}

export default async function CatalogPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'catalog' });

  const products = await getAllProducts();
  const allSizes = [...new Set(products.map((p) => p.size))].sort();

  const l = locale as Locale;
  const homeUrl = `${BASE_URL}/${locale}`;
  const catalogUrl = `${BASE_URL}/${locale}/catalog`;
  const HOME_LABELS: Record<string, string> = {
    ru: '\u0413\u043b\u0430\u0432\u043d\u0430\u044f',
    en: 'Home',
    hy: '\u0533\u056c\u056d\u0561\u057e\u0578\u0580',
  };
  const homeLabel = HOME_LABELS[locale] ?? 'Home';

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeLabel, item: homeUrl },
      { '@type': 'ListItem', position: 2, name: t('title'), item: catalogUrl },
    ],
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('title'),
    url: catalogUrl,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 20).map((product, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${BASE_URL}/${locale}/product/${product.id}`,
      name: product.name[l],
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <div className="pt-10">
        <div
          className="relative py-16 text-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #fdf8f0 100%)' }}
        >
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #fecdd3 0%, transparent 60%)' }} />
          <div className="relative max-w-4xl mx-auto px-4">
            <p className="text-rose-600 text-xs tracking-widest uppercase font-semibold mb-3">
              {t('collectionEyebrow')}
            </p>
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
          locale={l}
          products={products}
          allSizes={allSizes}
          categories={categories}
        />
      </div>
    </>
  );
}
