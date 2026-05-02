import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/db-products';
import { Locale } from '@/lib/types';
import ProductDetail from '@/components/product/ProductDetail';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://morena-cosmetics.ru';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: 'Product Not Found' };
  const l = locale as Locale;
  const title = product.name[l];
  const description = product.shortDescription[l];
  const image = product.images[0];
  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}/product/${id}`,
      languages: {
        ru: `${BASE_URL}/ru/product/${id}`,
        en: `${BASE_URL}/en/product/${id}`,
        hy: `${BASE_URL}/hy/product/${id}`,
        'x-default': `${BASE_URL}/ru/product/${id}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/product/${id}`,
      type: 'website',
      images: image ? [{ url: image, width: 800, height: 800, alt: title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

const NAV: Record<string, { home: string; catalog: string }> = {
  ru: { home: '\u0413\u043b\u0430\u0432\u043d\u0430\u044f', catalog: '\u041a\u0430\u0442\u0430\u043b\u043e\u0433' },
  en: { home: 'Home', catalog: 'Catalog' },
  hy: { home: '\u0533\u056c\u056d\u0561\u057e\u0578\u0580', catalog: '\u053f\u0561\u057f\u0561\u056c\u0578\u0563' },
};

export default async function ProductPage({ params }: Props) {
  const { locale, id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();
  const l = locale as Locale;

  const price = product.discountedPrice ?? product.price;
  const productUrl = `${BASE_URL}/${locale}/product/${id}`;
  const catalogUrl = `${BASE_URL}/${locale}/catalog`;
  const homeUrl = `${BASE_URL}/${locale}`;
  const { home: homeLabel, catalog: catalogLabel } = NAV[locale] ?? NAV.en;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeLabel, item: homeUrl },
      { '@type': 'ListItem', position: 2, name: catalogLabel, item: catalogUrl },
      { '@type': 'ListItem', position: 3, name: product.name[l], item: productUrl },
    ],
  };

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': productUrl,
    name: product.name[l],
    description: product.shortDescription[l],
    image: product.images,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: 'Morena Cosmetics',
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'RUB',
      price: price,
      availability:
        product.stockQuantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Morena Cosmetics',
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetail product={product} locale={l} />
    </>
  );
}
