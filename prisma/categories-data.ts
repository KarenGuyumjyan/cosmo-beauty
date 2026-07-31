/**
 * Canonical category rows.
 *
 * Shared by `seed.ts` and `import-mysql.ts`: the old Postgres database stored
 * categories as a `ProductCategory` enum with labels living in code, so when
 * importing from a pre-Category-table dump these rows rebuild the table.
 */
export const CATEGORIES = [
  { slug: 'cosmetic_sponges',  nameEn: 'Cosmetic Sponges',  nameHy: 'Կոսմետիկ սպունգեր',   nameRu: 'Косметические спонжи', skuPrefix: 'SP', sortOrder: 1 },
  { slug: 'lip_liner',         nameEn: 'Lip Liner',         nameHy: 'Շրթունքների մատիտ',    nameRu: 'Карандаш для губ',     skuPrefix: 'LL', sortOrder: 2 },
  { slug: 'blush',             nameEn: 'Blush',             nameHy: 'Երանգավորիչ',          nameRu: 'Румяна',               skuPrefix: 'BL', sortOrder: 3 },
  { slug: 'stick',             nameEn: 'Stick',             nameHy: 'Սթիք',                 nameRu: 'Стик',                 skuPrefix: 'ST', sortOrder: 4 },
  { slug: 'lip_gloss',         nameEn: 'Lip Gloss',         nameHy: 'Շրթունքների փայլ',      nameRu: 'Блеск для губ',        skuPrefix: 'LG', sortOrder: 5 },
  { slug: 'highlighter',       nameEn: 'Highlighter',       nameHy: 'Լուսավորիչ',           nameRu: 'Сияющие румяна',       skuPrefix: 'LB', sortOrder: 6 },
  { slug: 'concealer',         nameEn: 'Concealer',         nameHy: 'Կոնսիլյար',            nameRu: 'Консилер',             skuPrefix: 'CO', sortOrder: 7 },
  { slug: 'eyeshadow_palette', nameEn: 'Eyeshadow Palette', nameHy: 'Ստվերների ներկապնակ', nameRu: 'Палетка теней',        skuPrefix: 'EP', sortOrder: 8 },
  { slug: 'setting_spray',     nameEn: 'Setting Spray',     nameHy: 'Ֆիքսացնող սփրեյ',      nameRu: 'Спрей-фиксатор',       skuPrefix: 'SS', sortOrder: 9 },
  { slug: 'false_eyelashes',   nameEn: 'False Eyelashes',   nameHy: 'Թարթիչներ',            nameRu: 'Накладные ресницы',    skuPrefix: 'FE', sortOrder: 10 },
  { slug: 'makeup_fixer',      nameEn: 'Makeup Fixer',      nameHy: 'Մակյաժի ֆիքսիչ',       nameRu: 'Фиксатор макияжа',     skuPrefix: 'MF', sortOrder: 11 },
];

/** Fallback SKU prefix for a category slug not in the canonical list. */
export function fallbackSkuPrefix(slug: string): string {
  const letters = slug.replace(/[^a-z]/gi, '').toUpperCase();
  return (letters.slice(0, 2) || 'XX');
}
