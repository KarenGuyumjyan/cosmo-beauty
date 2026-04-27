'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { ShoppingBag, ArrowRight, Loader2, PackageCheck } from 'lucide-react'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { useCart } from '@/context/CartContext'
import { createOrder } from '@/app/[locale]/checkout/actions'
import type { Locale } from '@/lib/types'
import type { CdekDeliverySelection, CdekParcel } from '@/lib/cdek/types'
import CdekPickupDelivery from '@/components/checkout/CdekPickupDelivery'
import {
  formatPhone,
  isValidRuPhone,
  RU_PHONE_DISPLAY_MAX_LENGTH,
  RU_PHONE_PREFIX,
} from '@/lib/utils/phone'

const CURRENCY = '₽'

export default function CheckoutPageClient({ locale }: { locale: Locale }) {
  const t = useTranslations('checkout')
  const { items, subtotal, clearCart } = useCart()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [delivery, setDelivery] = useState<CdekDeliverySelection | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [selectedPickupType, setSelectedPickupType] = useState<
    'cdek' | 'yandex'
  >('cdek')

  const shippingCost = delivery?.finalPrice ?? 0
  const total = subtotal + shippingCost

  // Stable reference: only recompute when cart contents actually change.
  // Without this, every parent re-render produced a fresh array reference,
  // which retriggered the CDEK delivery effect and wiped the selected pickup point.
  const parcels = useMemo<CdekParcel[]>(
    () =>
      items.map((item) => ({
        weight: Math.max(1, (item.product.weightGrams ?? 100) * item.quantity),
        length: Math.max(1, item.product.lengthCm ?? 20),
        width: Math.max(1, item.product.widthCm ?? 20),
        height: Math.max(1, item.product.heightCm ?? 10),
      })),
    [items],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) return setError(t('errors.nameRequired'))
    if (!phone.trim()) return setError(t('errors.phoneRequired'))
    if (!email.trim()) return setError(t('errors.emailRequired'))
    if (!isValidRuPhone(phone)) return setError(t('errors.phoneInvalid'))
    if (!delivery) return setError(t('errors.deliveryRequired'))
    if (delivery.finalPrice <= 0)
      return setError(t('errors.deliveryPriceInvalid'))

    setSubmitting(true)
    try {
      const result = await createOrder({
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        delivery,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        locale,
      })

      if ('error' in result) {
        setError(result.error)
        setSubmitting(false)
        return
      }

      clearCart()
      window.location.href = result.paymentUrl
    } catch {
      setError(t('errors.generic'))
      setSubmitting(false)
    }
  }
  const togglePickupType = (type: 'cdek' | 'yandex') => {
    if (type !== selectedPickupType) {
      setSelectedPickupType(type)
      setDelivery(null)
    }
  }

  if (!items.length) {
    return (
      <div className='pt-32 pb-24 min-h-dvh flex items-center justify-center'>
        <Loader2 size={32} className='animate-spin text-rose-400' />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className='pt-32 pb-24 min-h-dvh flex items-center justify-center'>
        <div className='text-center max-w-sm mx-auto px-4'>
          <div className='w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6'>
            <ShoppingBag size={40} className='text-rose-400' />
          </div>
          <h2
            className='text-2xl font-bold text-stone-900 mb-3'
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('emptyCart')}
          </h2>
          <Link
            href='/cart'
            className='inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3.5 rounded-full transition-colors'
          >
            {t('goToCart')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='pt-24 pb-16 min-h-dvh' style={{ background: '#fdf8f0' }}>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h1
          className='text-3xl sm:text-4xl font-bold text-stone-900 mb-10'
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('title')}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>
            <div className='lg:col-span-2 space-y-6'>
              <div className='bg-white rounded-2xl border border-stone-100 p-6'>
                <h2 className='font-bold text-stone-900 text-lg mb-5'>
                  {t('contact')}
                </h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-stone-700 mb-1.5'>
                      {t('name')} *
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('namePlaceholder')}
                      required
                      className='w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-stone-700 mb-1.5'>
                      {t('phone')} *
                    </label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      onFocus={() => {
                        if (!phone) setPhone(RU_PHONE_PREFIX)
                      }}
                      onBlur={() => {
                        if (phone === RU_PHONE_PREFIX) setPhone('')
                      }}
                      placeholder={`${RU_PHONE_PREFIX} (___) ___-__-__`}
                      type='tel'
                      maxLength={RU_PHONE_DISPLAY_MAX_LENGTH}
                      required
                      className='w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors'
                    />
                  </div>
                  <div className='sm:col-span-2'>
                    <label className='block text-sm font-medium text-stone-700 mb-1.5'>
                      {t('email')} *
                    </label>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('emailPlaceholder')}
                      autoComplete='email'
                      type='email'
                      required
                      className='w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors'
                    />
                  </div>
                </div>
              </div>
              <div className='bg-white rounded-2xl border border-stone-100 p-6 flex gap-5'>
                <button
                  type='button'
                  onClick={() => togglePickupType('cdek')}
                  className={`rounded-2xl bg-stone-50 p-4 w-fit flex items-center gap-3 border transition ${
                    selectedPickupType === 'cdek'
                      ? 'border-rose-700'
                      : 'border-transparent'
                  }`}
                >
                  <div className='w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-stone-200 shrink-0'>
                    <PackageCheck size={18} className='text-rose-600' />
                  </div>

                  <p className='font-semibold text-stone-800'>
                    {t('cdekPickupPoint')}
                  </p>
                </button>

                <button
                  type='button'
                  onClick={() => togglePickupType('yandex')}
                  className={`rounded-2xl bg-stone-50 p-4 w-fit flex items-center gap-3 border transition ${
                    selectedPickupType === 'yandex'
                      ? 'border-rose-700'
                      : 'border-transparent'
                  }`}
                >
                  <div className='w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-stone-200 shrink-0'>
                    <PackageCheck size={18} className='text-rose-600' />
                  </div>

                  <p className='font-semibold text-stone-800'>
                    {t('yandexPickupPoint')}
                  </p>
                </button>
              </div>
              {selectedPickupType === 'cdek' ? (
                <CdekPickupDelivery parcels={parcels} onChange={setDelivery} />
              ) : null}
            </div>

            <div className='bg-white rounded-2xl border border-stone-100 p-6 sticky top-24'>
              <h2 className='font-bold text-stone-900 text-lg mb-5'>
                {t('orderSummary')}
              </h2>

              <div className='space-y-3 mb-5 max-h-64 overflow-y-auto'>
                {items.map((item) => {
                  const price =
                    item.product.discountedPrice ?? item.product.price
                  return (
                    <div key={item.product.id} className='flex gap-3'>
                      <div className='relative w-14 h-14 rounded-lg overflow-hidden bg-stone-50 shrink-0'>
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name[locale]}
                          fill
                          sizes='56px'
                          className='object-cover'
                        />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-stone-800 truncate'>
                          {item.product.name[locale]}
                        </p>
                        <p className='text-xs text-stone-400'>
                          x{item.quantity}
                        </p>
                      </div>
                      <p className='text-sm font-semibold text-stone-800 shrink-0'>
                        {(price * item.quantity).toLocaleString()} {CURRENCY}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className='space-y-2 text-sm border-t border-stone-100 pt-4 mb-4'>
                <div className='flex justify-between text-stone-600'>
                  <span>{t('subtotal')}</span>
                  <span className='font-medium'>
                    {subtotal.toLocaleString()} {CURRENCY}
                  </span>
                </div>
                {shippingCost > 0 && (
                  <div className='flex justify-between text-stone-600'>
                    <span>CDEK (ПВЗ)</span>
                    <span className='font-medium'>
                      {shippingCost.toLocaleString()} {CURRENCY}
                    </span>
                  </div>
                )}
                {delivery && (
                  <div className='text-xs text-stone-500 border-t border-dashed border-stone-100 pt-2 mt-2'>
                    <p className='font-medium text-stone-600'>
                      {delivery.pickupPointName}
                    </p>
                    {delivery.pickupPointAddress && (
                      <p className='leading-snug'>
                        {delivery.pickupPointAddress}
                      </p>
                    )}
                    <p className='mt-1 text-stone-400'>
                      {delivery.city} · код ПВЗ: {delivery.pickupPointCode}
                    </p>
                  </div>
                )}
              </div>

              <div className='border-t border-stone-100 pt-4 mb-6'>
                <div className='flex justify-between font-bold text-stone-900 text-lg'>
                  <span>{t('total')}</span>
                  <span className='text-rose-700'>
                    {total.toLocaleString()} {CURRENCY}
                  </span>
                </div>
              </div>

              {error && (
                <div className='bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4'>
                  {error}
                </div>
              )}

              <button
                type='submit'
                disabled={submitting || !delivery || shippingCost <= 0}
                className='w-full bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:hover:bg-rose-600 disabled:active:scale-100 text-white font-bold py-4 rounded-2xl transition-all text-base shadow-lg shadow-rose-200 flex items-center justify-center gap-2'
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className='animate-spin' />{' '}
                    {t('processing')}
                  </>
                ) : (
                  <>
                    {t('buyNow')} <ArrowRight size={18} />
                  </>
                )}
              </button>

              <p className='text-center text-xs text-stone-400 mt-4'>
                🔒 {t('securePayment')}
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
