/**
 * Latin → Cyrillic helpers for CDEK city search.
 *
 * CDEK's `/v2/location/suggest/cities` endpoint matches a Cyrillic prefix only,
 * so a user typing "mos" / "moscow" / "msk" returns nothing if we forward as-is.
 * We try to expand the query into a list of likely Cyrillic candidates the
 * server can match against.
 */

const ALIAS_MAP: Record<string, string> = {
  // Capitals & big cities
  moscow: 'Москва',
  msk: 'Москва',
  'saint petersburg': 'Санкт-Петербург',
  'st petersburg': 'Санкт-Петербург',
  'st. petersburg': 'Санкт-Петербург',
  petersburg: 'Санкт-Петербург',
  spb: 'Санкт-Петербург',
  piter: 'Санкт-Петербург',
  ekaterinburg: 'Екатеринбург',
  yekaterinburg: 'Екатеринбург',
  ekb: 'Екатеринбург',
  novosibirsk: 'Новосибирск',
  nsk: 'Новосибирск',
  kazan: 'Казань',
  'nizhny novgorod': 'Нижний Новгород',
  'nizhniy novgorod': 'Нижний Новгород',
  nn: 'Нижний Новгород',
  'rostov on don': 'Ростов-на-Дону',
  'rostov-on-don': 'Ростов-на-Дону',
  rostov: 'Ростов-на-Дону',
  sochi: 'Сочи',
  krasnodar: 'Краснодар',
  samara: 'Самара',
  ufa: 'Уфа',
  perm: 'Пермь',
  volgograd: 'Волгоград',
  voronezh: 'Воронеж',
  saratov: 'Саратов',
  tyumen: 'Тюмень',
  chelyabinsk: 'Челябинск',
  omsk: 'Омск',
  irkutsk: 'Иркутск',
  vladivostok: 'Владивосток',
  khabarovsk: 'Хабаровск',
  kaliningrad: 'Калининград',
  yerevan: 'Ереван',
  minsk: 'Минск',
};

function isLatinishForTranslit(s: string): boolean {
  return /[A-Za-z]/.test(s) && !/[\u0400-\u04FF]/.test(s);
}

/** Two-letter digraphs first so they win against single-letter mappings. */
const DIGRAPHS: Array<[string, string]> = [
  ['shch', 'щ'],
  ['sch', 'щ'],
  ['zh', 'ж'],
  ['kh', 'х'],
  ['ts', 'ц'],
  ['ch', 'ч'],
  ['sh', 'ш'],
  ['yu', 'ю'],
  ['ju', 'ю'],
  ['ya', 'я'],
  ['ja', 'я'],
  ['yo', 'ё'],
  ['jo', 'ё'],
  ['ye', 'е'],
  ['je', 'е'],
];

const SINGLES: Record<string, string> = {
  a: 'а',
  b: 'б',
  c: 'к',
  d: 'д',
  e: 'е',
  f: 'ф',
  g: 'г',
  h: 'х',
  i: 'и',
  j: 'й',
  k: 'к',
  l: 'л',
  m: 'м',
  n: 'н',
  o: 'о',
  p: 'п',
  q: 'к',
  r: 'р',
  s: 'с',
  t: 'т',
  u: 'у',
  v: 'в',
  w: 'в',
  x: 'кс',
  y: 'й',
  z: 'з',
  "'": '',
};

function transliterate(input: string): string {
  const lower = input.toLowerCase();
  let i = 0;
  let out = '';
  while (i < lower.length) {
    let matched = false;
    for (const [src, dst] of DIGRAPHS) {
      if (lower.startsWith(src, i)) {
        out += dst;
        i += src.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    const ch = lower[i];
    out += SINGLES[ch] ?? ch;
    i += 1;
  }
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/**
 * For an arbitrary user query, return one or more search strings
 * to try against CDEK. Order = priority (best matches first).
 *
 * `ALIAS_MAP` is always evaluated (so commas / extra text like "Moscow, RU" still resolve).
 * Latin transliteration runs only for Latin (non-Cyrillic) text.
 */
export function expandCdekCityQueries(rawQuery: string): string[] {
  const trimmed = rawQuery.trim();
  if (!trimmed) return [];

  const out: string[] = [];
  const seen = new Set<string>();
  const add = (s: string) => {
    if (!s || seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };

  add(trimmed);
  const lower = trimmed.toLowerCase();

  const fromAlias = (k: string) => {
    const a = ALIAS_MAP[k];
    if (a) add(a);
  };
  fromAlias(lower);

  fromAlias(lower.replace(/\s+/g, ' ').trim());
  for (const w of lower.split(/[\s,/;]+/)) {
    if (w) fromAlias(w);
  }
  const firstSeg = lower.split(/[,/;]/)[0]?.replace(/\s+/g, ' ').trim() ?? '';
  if (firstSeg) fromAlias(firstSeg);

  if (isLatinishForTranslit(trimmed)) {
    const t = transliterate(trimmed);
    if (t) {
      add(t);
      if (t.length > 4) add(t.slice(0, 4));
    }
  }

  return out;
}
