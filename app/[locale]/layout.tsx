import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { CartProvider } from '@/context/CartContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { Metadata } from 'next';
import { SpeedInsights } from "@vercel/speed-insights/next"

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await params;
  return {
    title: {
      default: 'Morena Cosmetics',
      template: '%s | Morena Cosmetics',
    },
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <CartProvider>
        <Header locale={locale} />
        <main className="min-h-dvh">{children}</main>
        <Footer />
        <SpeedInsights />
      </CartProvider>
    </NextIntlClientProvider>
  );
}
