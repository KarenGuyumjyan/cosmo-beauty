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
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/product/${id}`,
      type: 'website',
      images: [{ url: image, width: 800, height: 800, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();
  const l = locale as Locale;

  const price = product.discountedPrice ?? product.price;
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name[l],
    description: product.shortDescription[l],
    image: product.images,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/${locale}/product/${id}`,
      priceCurrency: 'RUB',
      price: price.toString(),
      availability:
        product.stockQuantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetail product={product} locale={l} />
    </>
  );
}
