import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Locale } from '@/lib/types';
import CartPageClient from '@/components/cart/CartPageClient';
import { buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.cart' });
  return buildPageMetadata({
    locale,
    path: '/cart',
    title: t('title'),
    description: t('description'),
    noIndex: true,
  });
}

export default async function CartPage({ params }: Props) {
  const { locale } = await params;
  return <CartPageClient locale={locale as Locale} />;
}
