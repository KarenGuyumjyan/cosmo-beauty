'use client';

import { useTranslations } from 'next-intl';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import CartItem from '@/components/cart/CartItem';
import { Locale } from '@/lib/types';

interface CartPageClientProps {
  locale: Locale;
}

const CURRENCY = '₽';

export default function CartPageClient({ locale }: CartPageClientProps) {
  const t = useTranslations('cart');
  const { items, subtotal } = useCart();

  const savingsTotal = items.reduce(
    (sum, item) =>
      sum +
      (item.product.discountedPrice
        ? (item.product.price - item.product.discountedPrice) * item.quantity
        : 0),
    0
  );

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={40} className="text-rose-400" />
          </div>
          <h2
            className="text-2xl font-bold text-stone-900 mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('empty')}
          </h2>
          <p className="text-stone-500 mb-8">{t('emptySubtitle')}</p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3.5 rounded-full transition-colors"
          >
            {t('continueShopping')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen" style={{ background: '#fdf8f0' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1
          className="text-3xl sm:text-4xl font-bold text-stone-900 mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('title')}
        </h1>
        <p className="text-stone-500 mb-10 text-sm">
          {items.reduce((s, i) => s + i.quantity, 0)} {items.reduce((s, i) => s + i.quantity, 0) === 1 ? t('item', { count: 1 }) : t('items', { count: items.reduce((s, i) => s + i.quantity, 0) })}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Items list */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-100 p-6">
            {items.map((item) => (
              <CartItem key={item.product.id} item={item} locale={locale} />
            ))}
            <div className="mt-4 pt-4">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-rose-600 transition-colors"
              >
                ← {t('continueShopping')}
              </Link>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-2xl border border-stone-100 p-6 sticky top-24">
            <h2 className="font-bold text-stone-900 text-lg mb-5">Order Summary</h2>

            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between text-stone-600">
                <span>{t('subtotal')}</span>
                <span className="font-medium text-stone-800">{subtotal.toLocaleString()} {CURRENCY}</span>
              </div>
              {savingsTotal > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t('discount')}</span>
                  <span className="font-medium">-{savingsTotal.toLocaleString()} {CURRENCY}</span>
                </div>
              )}
            </div>

            <div className="border-t border-stone-100 pt-4 mb-6">
              <div className="flex justify-between font-bold text-stone-900 text-lg">
                <span>{t('subtotal')}</span>
                <span className="text-rose-700">{subtotal.toLocaleString()} {CURRENCY}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all text-base shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
            >
              {t('checkout')} <ArrowRight size={18} />
            </Link>

            <p className="text-center text-xs text-stone-400 mt-4">
              🔒 Secure checkout · Encrypted payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
