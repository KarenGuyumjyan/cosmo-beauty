import type { CdekCity } from './types';

/**
 * Address and city autocomplete backed by CDEK's own geocoder.
 *
 * `my.cdek.ru/api/geo/autocomplete` is the endpoint the CDEK personal cabinet
 * and delivery widget call while you type. It is undocumented and not part of
 * the v2 integration API (which has no address-suggestion endpoint at all),
 * but it needs no OAuth token and it is the only source guaranteed to return
 * addresses CDEK itself will accept on an order - a Yandex-formatted string
 * can be rejected at order creation.
 *
 * Because it is a private endpoint it may change or start refusing us without
 * notice, so every failure resolves to an empty list and the caller falls back
 * to the v2 API (cities) or Yandex Suggest (addresses).
 */

const AUTOCOMPLETE_URL = 'https://my.cdek.ru/api/geo/autocomplete';

/** Milliseconds before we give up and let the caller fall back. */
const TIMEOUT_MS = 4_000;

/**
 * The cabinet sends `source=3` (the address-provider id its own UI uses).
 * Anything else returns an empty list.
 */
const SOURCE = '3';

type CdekGeoAddress = {
  /** Full formatted line, e.g. `"г Москва, ул Тверская, д 10"`. */
  address?: string;
  coords?: { latitude?: number; longitude?: number };
  cityUuid?: string;
  /** False for locality-only matches ("Москва"), true once a house is known. */
  isFullAddress?: boolean;
  countryIsoCode?: string;
  country?: string;
  region?: string;
  city?: string;
  street?: string;
  house?: string;
  postalCode?: string;
};

/**
 * Only the numeric city code matters here. It is the one place the geocoder
 * exposes it - the address block itself carries a `cityUuid`, which nothing in
 * the v2 API accepts.
 */
type CdekGeoOffice = {
  cityCode?: number;
  city?: string;
};

/**
 * Results interleave street addresses and pickup points; `office` entries are
 * what the widget renders as map pins and are useless for a courier address.
 */
type CdekGeoItem = {
  address?: CdekGeoAddress & { offices?: CdekGeoOffice[] };
  office?: CdekGeoOffice;
};

/**
 * Ask the geocoder about `query`.
 *
 * `extra` carries the mode flags: with none the response is plain addresses,
 * with `action=handOut&mode=ap` each locality also nests the pickup points
 * around it (see `fetchCdekCitySuggestions`). Resolves to `[]` on any failure -
 * every caller has a fallback and none may block checkout.
 */
async function requestAutocomplete(
  query: string,
  extra: Record<string, string> = {},
): Promise<CdekGeoItem[]> {
  const url = new URL(AUTOCOMPLETE_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('source', SOURCE);
  for (const [key, value] of Object.entries(extra)) {
    url.searchParams.set(key, value);
  }

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        // The endpoint is meant for the cabinet's own frontend and answers
        // with an empty body for clients that look automated.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Referer: 'https://my.cdek.ru/',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as CdekGeoItem[]) : [];
  } catch {
    return [];
  }
}

export type CdekAddressHint = {
  /** Display text, also what gets sent to CDEK as `to_location.address`. */
  label: string;
  city: string;
  street: string;
  house: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  /** Locality-only matches are kept but ranked last - see `fetchCdekAddressHints`. */
  isFullAddress: boolean;
};

function toHint(address: CdekGeoAddress): CdekAddressHint | null {
  const label = (address.address ?? '').trim();
  if (!label) return null;
  return {
    label,
    city: address.city ?? '',
    street: address.street ?? '',
    house: address.house ?? '',
    postalCode: address.postalCode ?? '',
    latitude: address.coords?.latitude,
    longitude: address.coords?.longitude,
    isFullAddress: address.isFullAddress === true,
  };
}

/**
 * Street-address suggestions for `query`.
 *
 * `query` should already include the city ("Москва, Тверская 10") - the
 * endpoint has no city filter, only an optional lat/lon proximity bias.
 * Returns `[]` on any failure; hints are advisory and must never block
 * checkout.
 */
export async function fetchCdekAddressHints(
  query: string,
  {
    countryIsoCode = 'RU',
    limit = 5,
    lat,
    lon,
  }: {
    countryIsoCode?: string;
    limit?: number;
    lat?: number;
    lon?: number;
  } = {},
): Promise<CdekAddressHint[]> {
  const text = query.trim();
  if (!text) return [];

  const items = await requestAutocomplete(text, {
    country: countryIsoCode,
    ...(typeof lat === 'number' && typeof lon === 'number'
      ? { lat: String(lat), lon: String(lon) }
      : {}),
  });

  const hints = items
    .filter((item) => item && item.address && !item.office)
    .map((item) => toHint(item.address!))
    .filter((hint): hint is CdekAddressHint => hint !== null);

  // Full street+house matches first: a bare "Москва" is a valid response to a
  // half-typed street but is never the address the customer wants to pick.
  const ranked = [
    ...hints.filter((h) => h.isFullAddress),
    ...hints.filter((h) => !h.isFullAddress),
  ];

  // Dedupe: the endpoint can return the same line twice for different sources.
  const seen = new Set<string>();
  const unique = ranked.filter((hint) => {
    if (seen.has(hint.label)) return false;
    seen.add(hint.label);
    return true;
  });

  return unique.slice(0, limit);
}

/**
 * Cities matching `query`, as CDEK's own widget resolves them.
 *
 * This exists because `/location/cities` is paginated: pulling a page of it
 * gives an arbitrary slice of Russia, so any city outside that slice simply
 * could not be picked at checkout. The geocoder searches the whole country.
 *
 * `action=handOut&mode=ap` is the flag pair that makes each locality carry a
 * nested `offices[]`, and that is the only place the response exposes the
 * numeric `cityCode` that `/deliverypoints` and the quote endpoint need - the
 * address block itself only has a `cityUuid`. It doubles as the filter we
 * want: a locality with no nested office is one CDEK has no pickup point in,
 * and a "city" the customer must not be able to choose.
 *
 * The nested offices are a preview (Samara returns 10 of its many), so they
 * are read for the code only - the point list still comes from
 * `getPickupPoints`.
 */
export async function fetchCdekCitySuggestions(
  query: string,
  { countryIsoCode = 'RU', limit = 15 }: {
    countryIsoCode?: string;
    limit?: number;
  } = {},
): Promise<CdekCity[]> {
  const text = query.trim();
  if (!text) return [];

  const items = await requestAutocomplete(text, {
    country: countryIsoCode,
    action: 'handOut',
    mode: 'ap',
  });

  const seen = new Set<number>();
  const cities: CdekCity[] = [];

  for (const item of items) {
    const address = item?.address;
    // Street-level rows repeat the locality they belong to ("...г Верхняя
    // Пышма, пр-кт Успенский"), so labels are built from the `city`/`region`
    // fields and deduped by code rather than taken from the formatted line.
    const code = address?.offices?.find((office) =>
      Number.isFinite(office?.cityCode),
    )?.cityCode;
    const city = address?.city?.trim();
    if (!code || !city || seen.has(code)) continue;
    seen.add(code);
    cities.push({
      code,
      city,
      region: address?.region?.trim() || undefined,
      country: address?.country?.trim() || undefined,
    });
    if (cities.length >= limit) break;
  }

  return cities;
}
