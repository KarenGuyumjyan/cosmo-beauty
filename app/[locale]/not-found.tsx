import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import Link from 'next/link'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function LocaleNotFound() {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'notFound' })

  return (
    <div className='relative min-h-[70vh] flex items-center justify-center overflow-hidden py-24 px-4'
      style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #fdf8f0 60%, #fef3e2 100%)' }}
    >
      {/* Decorative orbs */}
      <div className='pointer-events-none absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-rose-200/30 blur-3xl' />
      <div className='pointer-events-none absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-amber-100/40 blur-3xl' />

      <div className='relative z-10 text-center max-w-lg mx-auto'>
        {/* 404 number */}
        <p
          className='text-[9rem] sm:text-[12rem] font-bold leading-none text-rose-100 select-none'
          style={{ fontFamily: 'var(--font-display)' }}
          aria-hidden='true'
        >
          {t('code')}
        </p>

        {/* Eyebrow */}
        <p className='text-rose-600 text-xs tracking-widest uppercase font-semibold -mt-6 mb-4'>
          {t('code')}
        </p>

        {/* Heading */}
        <h1
          className='text-3xl sm:text-4xl font-bold text-stone-900 mb-4'
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('title')}
        </h1>

        {/* Description */}
        <p className='text-stone-500 text-base leading-relaxed mb-10 max-w-sm mx-auto'>
          {t('description')}
        </p>

        {/* CTAs */}
        <div className='flex flex-col sm:flex-row items-center justify-center gap-3'>
          <Link
            href={`/${locale}`}
            className='w-full sm:w-auto px-8 py-3.5 rounded-full border-2 border-stone-300 text-stone-700 font-semibold text-sm hover:border-stone-400 hover:text-stone-900 transition-colors'
          >
            {t('backHome')}
          </Link>
          <Link
            href={`/${locale}/catalog`}
            className='w-full sm:w-auto px-8 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-[.98] text-white font-semibold text-sm transition-all shadow-lg shadow-rose-200'
          >
            {t('catalog')}
          </Link>
        </div>
      </div>
    </div>
  )
}
