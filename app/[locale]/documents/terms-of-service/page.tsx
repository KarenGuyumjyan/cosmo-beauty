import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo.terms' })
  return buildPageMetadata({
    locale,
    path: '/documents/terms-of-service',
    title: t('title'),
    description: t('description'),
    noIndex: true,
  })
}

const TermsOfServicePage = () => {
  return (
    <div className='relative py-22 px-4 text-start overflow-hidden'>
      <h1 className='text-[clamp(24px,calc(14.85px+2.44vw),50px)] font-bold'>
        Условия использования
      </h1>
      <p className='mt-6 max-w-[800px] text-stone-600 whitespace-pre-line'>
        Документ находится в подготовке. Свяжитесь с нами по адресу{' '}
        <a
          href='mailto:morena_studio@mail.ru'
          className='text-rose-600 hover:underline'
        >
          morena_studio@mail.ru
        </a>{' '}
        для получения актуальной редакции условий.
      </p>
    </div>
  )
}

export default TermsOfServicePage
