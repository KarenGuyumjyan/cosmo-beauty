import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Locale } from '@/lib/types';
import CheckoutPageClient from '@/components/checkout/CheckoutPageClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'checkout' });
  return { title: t('title') };
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  return <CheckoutPageClient locale={locale as Locale} />;
}
