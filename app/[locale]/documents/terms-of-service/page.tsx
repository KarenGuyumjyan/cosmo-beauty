import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { generalText } from './constants'
import { BASE_URL, buildPageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo.terms' })

  // The legal text is only available in Russian. To avoid duplicate-content
  // penalties, point the canonical at the RU version for every locale and
  // noindex the non-RU mirrors.
  if (locale !== 'ru') {
    return {
      ...buildPageMetadata({
        locale,
        path: '/documents/terms-of-service',
        title: t('title'),
        description: t('description'),
        noIndex: true,
      }),
      alternates: {
        canonical: `${BASE_URL}/ru/documents/terms-of-service`,
      },
    }
  }

  return buildPageMetadata({
    locale,
    path: '/documents/terms-of-service',
    title: t('title'),
    description: t('description'),
  })
}

const normalizeDescription = (desc: string) =>
  desc
    .split('\n')
    .map((line) => line.trim())
    .filter(
      (line, i, arr) => !(line === '' && (i === 0 || i === arr.length - 1)),
    )
    .join('\n')

const PrivacyPolicyPage = () => {
  return (
    <article
      lang='ru'
      className='relative py-22 px-4 text-start overflow-hidden'
    >
      <h1 className='text-[clamp(24px,calc(14.85px+2.44vw),50px)] font-bold'>
        Публичная оферта
      </h1>
      {generalText.map(({ title, description }, index) => (
        <section key={index} className='mt-4'>
          <h2 className='text-[clamp(18px,calc(12.85px+1.44vw),30px)] font-bold py-4'>
            <span className='text-[clamp(30px,calc(14.0px+2.40vw),46px)]'>
              {index + 1}.{' '}
            </span>
            {title}
          </h2>
          <div className='whitespace-pre-line text-stone-700 leading-relaxed'>
            {normalizeDescription(description)}
          </div>
        </section>
      ))}
    </article>
  )
}

export default PrivacyPolicyPage
