import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Locale } from '@/lib/types';
import CheckoutPageClient from '@/components/checkout/CheckoutPageClient';
import { buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.checkout' });
  return buildPageMetadata({
    locale,
    path: '/checkout',
    title: t('title'),
    description: t('description'),
    noIndex: true,
  });
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  return <CheckoutPageClient locale={locale as Locale} />;
}
