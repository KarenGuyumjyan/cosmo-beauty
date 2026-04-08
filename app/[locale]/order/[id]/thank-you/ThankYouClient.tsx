'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle, Clock, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';

const CURRENCY = '₽';

interface OrderData {
  id: string;
  status: string;
  shippingMethod: string;
  shippingCost: number;
  subtotal: number;
  total: number;
  items: { id: string; name: string; quantity: number; price: number; image: string }[];
}

export default function ThankYouClient({ order }: { order: OrderData }) {
  const t = useTranslations('thankYou');
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPaid = order.status === 'PAID';

  return (
    <div className="pt-28 pb-20 min-h-screen" style={{ background: '#fdf8f0' }}>
      <div className="max-w-2xl mx-auto px-4">
        {/* Status icon */}
        <div className="text-center mb-10">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${isPaid ? 'bg-green-100' : 'bg-amber-100'}`}>
            {isPaid ? (
              <CheckCircle size={40} className="text-green-600" />
            ) : (
              <Clock size={40} className="text-amber-600" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {t('title')}
          </h1>
          <p className="text-stone-500">{t('subtitle')}</p>
          <p className="mt-3 text-sm text-stone-500">
            {t('orderNumber')}: <strong className="text-stone-800 font-mono">{order.id.slice(0, 8).toUpperCase()}</strong>
          </p>
          <p className={`mt-2 text-sm font-medium ${isPaid ? 'text-green-600' : 'text-amber-600'}`}>
            {isPaid ? t('paid') : t('pending')}
          </p>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-stone-100 p-6 mb-6">
          <h2 className="font-bold text-stone-900 mb-4">{t('items')}</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-stone-50 shrink-0">
                  {item.image && (
                    <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
                  <p className="text-xs text-stone-400">x{item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-stone-800">
                  {(item.price * item.quantity).toLocaleString()} {CURRENCY}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-stone-100 mt-4 pt-4 space-y-2 text-sm">
            {order.shippingCost > 0 && (
              <div className="flex justify-between text-stone-600">
                <span>{t('shipping')}</span>
                <span>{order.shippingCost.toLocaleString()} {CURRENCY}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-stone-900 text-lg pt-2 border-t border-stone-100">
              <span>{t('total')}</span>
              <span className="text-rose-700">{order.total.toLocaleString()} {CURRENCY}</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3.5 rounded-full transition-colors"
          >
            {t('continueShopping')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
