import { NextResponse } from 'next/server';
import { fetchCdekAddressHints } from '@/lib/cdek/geo-autocomplete';
import { fetchYandexSuggestAddresses } from '@/lib/yandex-maps/suggest';

/**
 * Address autocomplete for the CDEK courier address field.
 *
 * Primary source is CDEK's own cabinet geocoder
 * (`my.cdek.ru/api/geo/autocomplete`): its suggestions are addresses CDEK is
 * guaranteed to accept on an order. It is an undocumented private endpoint, so
 * Yandex Suggest stays behind it as a fallback for when it returns nothing -
 * that keeps the field working even if CDEK changes or blocks it.
 *
 * Proxied server-side so the query is scoped to the selected city and the
 * upstream calls stay out of the browser.
 *
 * POST { query: string, city?: string } -> { hints: string[] }
 */

type Body = {
  query?: unknown;
  city?: unknown;
};

const MIN_QUERY_LENGTH = 3;

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const query = String(body.query ?? '').trim();
  const city = String(body.city ?? '').trim();

  // Too short to be useful - avoid burning quota on single letters.
  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ hints: [] });
  }

  // Prefixing the city keeps results in the chosen locality; neither upstream
  // has a city-id filter on these endpoints.
  const text =
    city && !query.toLowerCase().includes(city.toLowerCase())
      ? `${city}, ${query}`
      : query;

  try {
    const cdekHints = await fetchCdekAddressHints(text);
    if (cdekHints.length > 0) {
      return NextResponse.json({ hints: cdekHints.map((hint) => hint.label) });
    }

    const hints = await fetchYandexSuggestAddresses(text);
    return NextResponse.json({ hints });
  } catch (error) {
    console.error('[address-hints] suggest failed', error);
    // Hints are a convenience: never block checkout because they failed.
    return NextResponse.json({ hints: [] });
  }
}
