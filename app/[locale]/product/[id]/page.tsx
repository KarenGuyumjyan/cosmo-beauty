import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/db-products';
import { Locale } from '@/lib/types';
import ProductDetail from '@/components/product/ProductDetail';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: 'Product Not Found' };
  const l = locale as Locale;
  return {
    title: product.name[l],
    description: product.shortDescription[l],
    openGraph: {
      images: [{ url: product.images[0] }],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return <ProductDetail product={product} locale={locale as Locale} />;
}
