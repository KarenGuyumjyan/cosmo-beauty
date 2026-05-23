import type { Category, CategoryOption, Locale } from './types'

/**
 * Localized labels for each `ProductCategory` enum value.
 *
 * The product catalog itself lives in the database (see `lib/db-products.ts`);
 * keep this file lean and dedicated to UI labels.
 */
export const categories: CategoryOption[] = [
  {
    value: 'cosmetic_sponges',
    label: {
      en: 'Cosmetic Sponges',
      hy: 'Կոսմետիկ սպունգեր',
      ru: 'Косметические спонжи',
    },
  },
  {
    value: 'lip_liner',
    label: {
      en: 'Lip Liner',
      hy: 'Շրթունքների մատիտ',
      ru: 'Карандаш для губ',
    },
  },
  {
    value: 'blush',
    label: { en: 'Blush', hy: 'Երանգավորիչ', ru: 'Румяна' },
  },
  { value: 'stick', label: { en: 'Stick', hy: 'Սթիք', ru: 'Стик' } },
  {
    value: 'lip_gloss',
    label: { en: 'Lip Gloss', hy: 'Շրթունքների փայլ', ru: 'Блеск для губ' },
  },
  {
    value: 'highlighter',
    label: { en: 'Highlighter', hy: 'Լուսավորիչ', ru: 'Сияющие румяна' },
  },
  {
    value: 'concealer',
    label: { en: 'Concealer', hy: 'Կոնսիլյար', ru: 'Консилер' },
  },
  {
    value: 'false_eyelashes',
    label: {
      en: 'False Eyelashes',
      hy: 'Թարթիչներ',
      ru: 'Накладные ресницы',
    },
  },
  {
    value: 'makeup_fixer',
    label: {
      en: 'Makeup Fixer',
      hy: 'Մակյաժի ֆիքսիչ',
      ru: 'Фиксатор макияжа',
    },
  },
]

/** Returns the localized display label for a category value. */
export function getCategoryLabel(value: Category, locale: Locale): string {
  return categories.find((c) => c.value === value)?.label[locale] ?? value
}
