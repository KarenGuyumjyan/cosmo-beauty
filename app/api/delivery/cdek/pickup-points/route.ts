import { NextResponse } from 'next/server';
import { getPickupPoints } from '@/lib/cdek/service';

export async function POST(req: Request) {
  let body: { cityCode?: unknown };
  try {
    body = (await req.json()) as { cityCode?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const cityCode = Number(body.cityCode);
  if (!Number.isFinite(cityCode)) {
    return NextResponse.json({ error: 'cityCode is required' }, { status: 400 });
  }

  try {
    const points = await getPickupPoints(cityCode);
    return NextResponse.json(points);
  } catch (error) {
    console.error('CDEK pickup points error', error);
    return NextResponse.json({ error: 'Failed to load pickup points' }, { status: 500 });
  }
}
