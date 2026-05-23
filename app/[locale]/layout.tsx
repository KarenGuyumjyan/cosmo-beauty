import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { BASE_URL, alternateOgLocales, languageAlternates, ogLocale, DEFAULT_OG_IMAGE } from '@/lib/seo';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });

  return {
    title: {
      default: t('defaultTitle'),
      template: '%s | Morena Cosmetics',
    },
    description: t('defaultDescription'),
    keywords: t.raw('keywords') as string[],
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: languageAlternates('/'),
    },
    openGraph: {
      type: 'website',
      siteName: 'Morena Cosmetics',
      locale: ogLocale(locale),
      alternateLocale: alternateOgLocales(locale),
      images: [DEFAULT_OG_IMAGE],
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
      <Header locale={locale} />
      <main className="min-h-dvh">{children}</main>
      <Footer />
      <SpeedInsights />
    </NextIntlClientProvider>
  );
}
