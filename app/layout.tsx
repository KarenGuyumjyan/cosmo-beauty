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

export const metadata: Metadata = {
  title: {
    default: 'Morena Cosmetics',
    template: '%s | Morena Cosmetics',
  },
  description: 'Premium cosmetics for every skin type.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let locale = 'ru';
  try {
    locale = await getLocale();
  } catch {
    // admin and other non-locale routes won't have a locale in context
  }

  return (
    <html lang={locale} className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="antialiased pb-[env(safe-area-inset-bottom)]">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
