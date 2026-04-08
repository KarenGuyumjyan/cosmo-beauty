'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingBag, ArrowRight, Truck, Store, Loader2, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useCart } from '@/context/CartContext';
import { createOrder } from '@/app/[locale]/checkout/actions';
import type { Locale } from '@/lib/types';
import type { ShippingMethod } from '@prisma/client';
import {
  formatPhone,
  isValidRuPhone,
  RU_PHONE_DISPLAY_MAX_LENGTH,
  RU_PHONE_PREFIX,
} from '@/lib/utils/phone';

const CURRENCY = '₽';
const PICKUP_ADDRESS = process.env.NEXT_PUBLIC_PICKUP_ADDRESS ?? '15 Baghramyan Ave, Yerevan';

export default function CheckoutPageClient({ locale }: { locale: Locale }) {
  const t = useTranslations('checkout');
  const { items, subtotal, clearCart } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [shipping, setShipping] = useState<ShippingMethod>('SELF_PICKUP');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryCost, setDeliveryCost] = useState<number | null>(null);
  const [calculatingDelivery, setCalculatingDelivery] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const estimateDelivery = useCallback(async (c: string, a: string) => {
    if (!c.trim() || !a.trim()) {
      setDeliveryCost(null);
      return;
    }
    setCalculatingDelivery(true);
    try {
      const res = await fetch('/api/delivery/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: c, address: a }),
      });
      const data = await res.json();
      setDeliveryCost(data.price ?? null);
    } catch {
      setDeliveryCost(null);
    } finally {
      setCalculatingDelivery(false);
    }
  }, []);

  useEffect(() => {
    if (shipping !== 'YANDEX_DELIVERY') {
      setDeliveryCost(null);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      estimateDelivery(city, address);
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [city, address, shipping, estimateDelivery]);

  const shippingCost = shipping === 'SELF_PICKUP' ? 0 : (deliveryCost ?? 0);
  const total = subtotal + shippingCost;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError(t('errors.nameRequired'));
    if (!phone.trim()) return setError(t('errors.phoneRequired'));
    if (!isValidRuPhone(phone)) return setError(t('errors.phoneInvalid'));
    if (shipping === 'YANDEX_DELIVERY') {
      if (!city.trim()) return setError(t('errors.cityRequired'));
      if (!address.trim()) return setError(t('errors.addressRequired'));
    }

    setSubmitting(true);
    try {
      const result = await createOrder({
        customerName: name,
        customerPhone: phone,
        customerEmail: email || undefined,
        shippingMethod: shipping,
        city: shipping === 'YANDEX_DELIVERY' ? city : undefined,
        address: shipping === 'YANDEX_DELIVERY' ? address : undefined,
        shippingCost,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        locale,
      });

      if ('error' in result) {
        setError(result.error);
        setSubmitting(false);
        return;
      }

      clearCart();
      window.location.href = result.paymentUrl;
    } catch {
      setError(t('errors.generic'));
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 min-h-dvh flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={40} className="text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            {t('emptyCart')}
          </h2>
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3.5 rounded-full transition-colors"
          >
            {t('goToCart')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-dvh" style={{ background: '#fdf8f0' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-10" style={{ fontFamily: 'var(--font-display)' }}>
          {t('title')}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left column: form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact */}
              <div className="bg-white rounded-2xl border border-stone-100 p-6">
                <h2 className="font-bold text-stone-900 text-lg mb-5">{t('contact')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('name')} *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('namePlaceholder')}
                      required
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('phone')} *</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      onFocus={() => {
                        if (!phone) setPhone(RU_PHONE_PREFIX);
                      }}
                      onBlur={() => {
                        if (phone === RU_PHONE_PREFIX) setPhone('');
                      }}
                      placeholder={`${RU_PHONE_PREFIX} (___) ___-__-__`}
                      type="tel"
                      maxLength={RU_PHONE_DISPLAY_MAX_LENGTH}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      {t('email')} <span className="text-stone-400 font-normal">({t('emailOptional')})</span>
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('emailPlaceholder')}
                      type="email"
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping method */}
              <div className="bg-white rounded-2xl border border-stone-100 p-6">
                <h2 className="font-bold text-stone-900 text-lg mb-5">{t('shipping')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShipping('YANDEX_DELIVERY')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      shipping === 'YANDEX_DELIVERY'
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <Truck size={20} className={shipping === 'YANDEX_DELIVERY' ? 'text-rose-600' : 'text-stone-400'} />
                    <div>
                      <p className="font-semibold text-sm text-stone-800">{t('yandexDelivery')}</p>
                      {deliveryCost !== null && shipping === 'YANDEX_DELIVERY' && (
                        <p className="text-xs text-stone-500 mt-0.5">{deliveryCost.toLocaleString()} {CURRENCY}</p>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShipping('SELF_PICKUP')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      shipping === 'SELF_PICKUP'
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <Store size={20} className={shipping === 'SELF_PICKUP' ? 'text-rose-600' : 'text-stone-400'} />
                    <div>
                      <p className="font-semibold text-sm text-stone-800">{t('selfPickup')}</p>
                    </div>
                  </button>
                </div>

                {/* Yandex Delivery address fields */}
                {shipping === 'YANDEX_DELIVERY' && (
                  <div className="mt-5 space-y-4">
                    <h3 className="text-sm font-semibold text-stone-700">{t('deliveryAddress')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('city')} *</label>
                        <input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder={t('cityPlaceholder')}
                          className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">{t('address')} *</label>
                        <input
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder={t('addressPlaceholder')}
                          className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors"
                        />
                      </div>
                    </div>
                    {calculatingDelivery && (
                      <p className="flex items-center gap-2 text-sm text-stone-500">
                        <Loader2 size={14} className="animate-spin" /> {t('calculating')}
                      </p>
                    )}
                    {!calculatingDelivery && deliveryCost !== null && (
                      <p className="text-sm text-stone-700">
                        {t('deliveryCost')}: <strong>{deliveryCost.toLocaleString()} {CURRENCY}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Self-pickup address */}
                {shipping === 'SELF_PICKUP' && (
                  <div className="mt-5 flex items-start gap-3 bg-stone-50 rounded-xl p-4">
                    <MapPin size={18} className="text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-stone-800">{t('pickupAddress')}</p>
                      <p className="text-sm text-stone-500 mt-0.5">{PICKUP_ADDRESS}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right column: order summary */}
            <div className="bg-white rounded-2xl border border-stone-100 p-6 sticky top-24">
              <h2 className="font-bold text-stone-900 text-lg mb-5">{t('orderSummary')}</h2>

              <div className="space-y-3 mb-5 max-h-64 overflow-y-auto">
                {items.map((item) => {
                  const price = item.product.discountedPrice ?? item.product.price;
                  return (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-stone-50 shrink-0">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name[locale]}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">
                          {item.product.name[locale]}
                        </p>
                        <p className="text-xs text-stone-400">x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-stone-800 shrink-0">
                        {(price * item.quantity).toLocaleString()} {CURRENCY}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 text-sm border-t border-stone-100 pt-4 mb-4">
                <div className="flex justify-between text-stone-600">
                  <span>{t('subtotal')}</span>
                  <span className="font-medium">{subtotal.toLocaleString()} {CURRENCY}</span>
                </div>
                {shippingCost > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>{t('yandexDelivery')}</span>
                    <span className="font-medium">{shippingCost.toLocaleString()} {CURRENCY}</span>
                  </div>
                )}
                {shipping === 'SELF_PICKUP' && (
                  <div className="flex justify-between text-stone-600">
                    <span>{t('selfPickup')}</span>
                    <span className="font-medium text-green-600">0 {CURRENCY}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-stone-100 pt-4 mb-6">
                <div className="flex justify-between font-bold text-stone-900 text-lg">
                  <span>{t('total')}</span>
                  <span className="text-rose-700">{total.toLocaleString()} {CURRENCY}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || (shipping === 'YANDEX_DELIVERY' && calculatingDelivery)}
                className="w-full bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-all text-base shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 size={18} className="animate-spin" /> {t('processing')}</>
                ) : (
                  <>{t('buyNow')} <ArrowRight size={18} /></>
                )}
              </button>

              <p className="text-center text-xs text-stone-400 mt-4">
                🔒 {t('securePayment')}
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
