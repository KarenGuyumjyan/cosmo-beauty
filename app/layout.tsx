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
    name: 'Morena Cosmetics',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    sameAs: [],
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
