import { NextResponse } from 'next/server';
import { listCities, searchCities } from '@/lib/cdek/service';
import { fetchCdekCitySuggestions } from '@/lib/cdek/geo-autocomplete';
import { cdekErrorResponse } from '@/lib/cdek/errors';

const MIN_QUERY_LENGTH = 2;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('query') ?? '').trim();

  try {
    if (query.length < MIN_QUERY_LENGTH) {
      return NextResponse.json(await listCities());
    }

    const suggested = await fetchCdekCitySuggestions(query);
    if (suggested.length > 0) {
      console.log(
        `[CDEK cities route] geocoder query="${query}" → ${suggested.length} result(s)`,
      );
      return NextResponse.json(suggested);
    }

    console.warn(
      `[CDEK cities route] geocoder returned nothing for query="${query}", falling back to /location/cities`,
    );
    return NextResponse.json(await searchCities(query));
  } catch (error) {
    console.error('[CDEK cities route] error for query="%s":', query, error);
    return cdekErrorResponse(error, 'Failed to load cities');
  }
}
