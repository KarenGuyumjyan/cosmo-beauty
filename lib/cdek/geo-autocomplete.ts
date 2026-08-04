/**
 * Address autocomplete backed by CDEK's own geocoder.
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
 * to Yandex Suggest.
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
 * Results interleave street addresses and pickup points; `office` entries are
 * what the widget renders as map pins and are useless for a courier address.
 */
type CdekGeoItem = {
  address?: CdekGeoAddress;
  office?: unknown;
};

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

  const url = new URL(AUTOCOMPLETE_URL);
  url.searchParams.set('query', text);
  url.searchParams.set('country', countryIsoCode);
  url.searchParams.set('source', SOURCE);
  if (typeof lat === 'number' && typeof lon === 'number') {
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
  }

  let data: unknown;
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
    data = await res.json();
  } catch {
    return [];
  }

  if (!Array.isArray(data)) return [];

  const hints = (data as CdekGeoItem[])
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
