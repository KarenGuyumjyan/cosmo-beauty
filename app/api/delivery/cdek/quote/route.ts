import { NextResponse } from 'next/server';
import { calculateQuote } from '@/lib/cdek/service';
import { cdekErrorResponse } from '@/lib/cdek/errors';
import type { CdekParcel } from '@/lib/cdek/types';

type Body = {
  cityCode?: unknown;
  parcels?: unknown;
  totalPrice?: unknown;
};

function isParcel(value: unknown): value is CdekParcel {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.weight === 'number' &&
    typeof v.length === 'number' &&
    typeof v.width === 'number' &&
    typeof v.height === 'number'
  );
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const cityCode = Number(body.cityCode);
  const parcels = Array.isArray(body.parcels) ? body.parcels.filter(isParcel) : [];
  const totalPrice = Number(body.totalPrice) || 0;
  if (!Number.isFinite(cityCode)) {
    return NextResponse.json({ error: 'cityCode is required' }, { status: 400 });
  }
  if (parcels.length === 0) {
    return NextResponse.json({ error: 'parcels are required' }, { status: 400 });
  }

  try {
    const quote = await calculateQuote(cityCode, parcels, totalPrice);
    return NextResponse.json(quote);
  } catch (error) {
    console.error('CDEK quote error', error);
    return cdekErrorResponse(error, 'Failed to calculate delivery');
  }
}
