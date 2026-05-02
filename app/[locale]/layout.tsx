import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { Metadata } from 'next';
import { SpeedInsights } from "@vercel/speed-insights/next"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://morena-cosmetics.ru';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const LOCALE_DESCRIPTIONS: Record<string, string> = {
  ru: 'Morena Cosmetics — интернет-магазин премиальной косметики. Блеск для губ, хайлайтер, румяна, консилер с доставкой по России.',
  en: 'Morena Cosmetics — online store for premium makeup & beauty. Lip gloss, highlighter, blush, concealer and more.',
  hy: 'Morena Cosmetics — կոսմետիկայի առցանց խանութ։ Շուրթերի փայլ, հայլայթեր, բլaш, կոնսիլյեր և ավելին։',
};

const LOCALE_KEYWORDS: Record<string, string[]> = {
  ru: ['Morena Cosmetics', 'косметика', 'блеск для губ', 'хайлайтер', 'румяна', 'консилер', 'карандаш для губ', 'макияж'],
  en: ['Morena Cosmetics', 'cosmetics', 'lip gloss', 'highlighter', 'blush', 'concealer', 'lip liner', 'makeup'],
  hy: ['Morena Cosmetics', 'կոսմետիկա', 'շուրթերի փայլ', 'հայլայթեր', 'բլaш', 'կոնսիլյեր', 'դիմահարդարման'],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const description = LOCALE_DESCRIPTIONS[locale] ?? LOCALE_DESCRIPTIONS.ru;
  return {
    title: {
      default: 'Morena Cosmetics',
      template: '%s | Morena Cosmetics',
    },
    description,
    keywords: LOCALE_KEYWORDS[locale] ?? LOCALE_KEYWORDS.ru,
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, `${BASE_URL}/${l}`])),
        'x-default': `${BASE_URL}/ru`,
      },
    },
    openGraph: {
      siteName: 'Morena Cosmetics',
      locale: locale === 'ru' ? 'ru_RU' : locale === 'hy' ? 'hy_AM' : 'en_US',
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => (l === 'ru' ? 'ru_RU' : l === 'hy' ? 'hy_AM' : 'en_US')),
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
