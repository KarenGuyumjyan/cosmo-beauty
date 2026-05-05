import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import { getLocale } from 'next-intl/server';
import { CartProvider } from '@/context/CartContext';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

const playfair = Playfair_Display({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://morena-cosmetics.ru';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Morena Cosmetics — Интернет-магазин косметики',
    template: '%s | Morena Cosmetics',
  },
  description:
    'Morena Cosmetics — интернет-магазин премиальной косметики. Блеск для губ, хайлайтер, румяна, консилер и многое другое с доставкой по России.',
  keywords: [
    'Morena Cosmetics',
    'косметика',
    'блеск для губ',
    'хайлайтер',
    'румяна',
    'консилер',
    'карандаш для губ',
    'cosmetics',
    'makeup',
    'lip gloss',
    'highlighter',
    'blush',
    'concealer',
  ],
  openGraph: {
    type: 'website',
    siteName: 'Morena Cosmetics',
    locale: 'ru_RU',
    alternateLocale: ['en_US', 'hy_AM'],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let locale = 'ru';
  try {
    locale = await getLocale();
  } catch {
    // admin and other non-locale routes won't have a locale in context
  }

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: 'Morena Cosmetics',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/logo.png`,
    },
    description:
      'Morena Cosmetics — premium makeup brand offering lip gloss, highlighters, blush, concealers and more.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+37411234567',
      contactType: 'customer service',
      email: 'morena_studio@mail.ru',
      availableLanguage: ['Russian', 'English', 'Armenian'],
    },
    sameAs: [
      'https://instagram.com',
      'https://facebook.com',
      'https://tiktok.com',
    ],
  };

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="antialiased pb-[env(safe-area-inset-bottom)]">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
