import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import type { Locale } from './types'

/**
 * Canonical base URL. All metadata helpers assume an absolute origin so
 * search engines see fully-qualified URLs.
 */
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ||
  'https://morena-cosmetics.ru'

/** Default 1200x630 social card. Update once a branded asset is uploaded. */
export const DEFAULT_OG_IMAGE = {
  url: `${BASE_URL}/og/default.jpg`,
  width: 1200,
  height: 630,
  alt: 'Morena Cosmetics',
}

const LOCALE_TO_OG_LOCALE: Record<Locale, string> = {
  ru: 'ru_RU',
  en: 'en_US',
  hy: 'hy_AM',
}

const LOCALE_TO_HTML_LANG: Record<Locale, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  hy: 'hy-AM',
}

export function ogLocale(locale: string): string {
  return LOCALE_TO_OG_LOCALE[locale as Locale] ?? 'ru_RU'
}

export function htmlLang(locale: string): string {
  return LOCALE_TO_HTML_LANG[locale as Locale] ?? 'ru-RU'
}

export function alternateOgLocales(currentLocale: string): string[] {
  return routing.locales
    .filter((l) => l !== currentLocale)
    .map((l) => LOCALE_TO_OG_LOCALE[l])
}

/**
 * Returns the `alternates.languages` map (including `x-default`) for a
 * locale-aware path. Always pass the path *without* the locale prefix
 * (e.g. `'/catalog'`, `''`, `/product/abc123`).
 */
export function languageAlternates(
  pathWithoutLocale: string,
): Record<string, string> {
  const path = pathWithoutLocale.startsWith('/')
    ? pathWithoutLocale
    : `/${pathWithoutLocale}`
  const normalized = path === '/' ? '' : path

  const map: Record<string, string> = {}
  for (const l of routing.locales) {
    map[l] = `${BASE_URL}/${l}${normalized}`
  }
  // x-default points to the default locale (Russian) per next-intl convention.
  map['x-default'] = `${BASE_URL}/${routing.defaultLocale}${normalized}`
  return map
}

type OgImage = { url: string; width?: number; height?: number; alt?: string }

interface BuildPageMetadataInput {
  locale: string
  /** Path WITHOUT locale prefix - '' for home, '/catalog', '/product/abc'. */
  path: string
  title: string
  description: string
  keywords?: string[]
  /** When true (default), wraps title with the site template; otherwise sets absolute title. */
  applyTitleTemplate?: boolean
  images?: OgImage[]
  ogType?: 'website' | 'article'
  /** Set to true on cart/checkout/order/admin - keeps them out of the index. */
  noIndex?: boolean
}

export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  keywords,
  applyTitleTemplate = true,
  images,
  ogType = 'website',
  noIndex = false,
}: BuildPageMetadataInput): Metadata {
  const url = `${BASE_URL}/${locale}${
    path === '' || path === '/' ? '' : path.startsWith('/') ? path : `/${path}`
  }`
  const ogImages = images && images.length > 0 ? images : [DEFAULT_OG_IMAGE]

  const metadata: Metadata = {
    title: applyTitleTemplate ? title : { absolute: title },
    description,
    keywords,
    alternates: {
      canonical: url,
      languages: languageAlternates(path),
    },
    openGraph: {
      type: ogType,
      title,
      description,
      url,
      siteName: 'Morena Cosmetics',
      locale: ogLocale(locale),
      alternateLocale: alternateOgLocales(locale),
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImages.map((i) => i.url),
    },
  }

  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    }
  }

  return metadata
}
