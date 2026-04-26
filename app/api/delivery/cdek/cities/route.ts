import { NextResponse } from 'next/server';
import { searchCities } from '@/lib/cdek/service';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') ?? '';
  if (query.trim().length < 2) return NextResponse.json([]);

  try {
    const cities = await searchCities(query);
    return NextResponse.json(cities);
  } catch (error) {
    console.error('CDEK cities error', error);
    return NextResponse.json({ error: 'Failed to load cities' }, { status: 500 });
  }
}
