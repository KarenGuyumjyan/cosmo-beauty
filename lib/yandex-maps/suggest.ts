type YandexSuggestResponse = {
  results?: Array<{ address?: { formatted_address?: string } }>;
};

/**
 * Address / street / house hints (Yandex Suggest API), Russia-wide (no bbox).
 * Uses `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` (same key as Maps JS).
 */
export async function fetchYandexSuggestAddresses(address: string): Promise<string[]> {
  const text = address.trim();
  if (!text) return [];

  const apikey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
  if (!apikey) return [];

  const url = new URL('https://suggest-maps.yandex.ru/v1/suggest');
  url.searchParams.set('text', text);
  url.searchParams.set('lang', 'ru');
  url.searchParams.set('results', '4');
  url.searchParams.set('types', 'street');
  url.searchParams.set('print_address', '1');
  url.searchParams.set('apikey', apikey);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return [];
    const data = (await response.json()) as YandexSuggestResponse;
    return (
      data?.results
        ?.map((item) => item.address?.formatted_address)
        .filter((s): s is string => typeof s === 'string' && s.length > 0) ?? []
    );
  } catch (e) {
    console.error('Error fetching address suggestions:', e);
    return [];
  }
}

type GeocodeResponse = {
  response?: {
    GeoObjectCollection?: {
      featureMember?: Array<{
        GeoObject?: { Point?: { pos?: string } };
      }>;
    };
  };
};

/** First point for the query; `pos` is `"lon lat"`. */
export async function fetchYandexGeocodeCenter(
  address: string
): Promise<[number, number] | null> {
  const text = address.trim();
  if (text.length <= 7) return null;

  const apikey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
  if (!apikey) return null;

  const url = new URL('https://geocode-maps.yandex.ru/1.x/');
  url.searchParams.set('apikey', apikey);
  url.searchParams.set('geocode', text);
  url.searchParams.set('format', 'json');
  url.searchParams.set('results', '1');

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = (await res.json()) as GeocodeResponse;
    const pos =
      data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos;
    if (!pos || typeof pos !== 'string') return null;
    const [lon, lat] = pos.split(/\s+/).map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return [lat, lon];
  } catch (e) {
    console.error('Error fetching coordinates:', e);
    return null;
  }
}
