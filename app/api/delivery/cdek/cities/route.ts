import { NextResponse } from 'next/server';
import { searchCities } from '@/lib/cdek/service';
import { cdekErrorResponse } from '@/lib/cdek/errors';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') ?? '';
  if (query.trim().length < 2) return NextResponse.json([]);

  try {
    const cities = await searchCities(query);
    console.log(`[CDEK cities route] query="${query}" → ${cities.length} result(s)`);
    return NextResponse.json(cities);
  } catch (error) {
    console.error('[CDEK cities route] error for query="%s":', query, error);
    return cdekErrorResponse(error, 'Failed to load cities');
  }
}
