import { NextResponse } from 'next/server';
import { calculateQuote } from '@/lib/cdek/service';
import { cdekErrorResponse } from '@/lib/cdek/errors';
import { CDEK_TARIFF_COURIER, CDEK_TARIFF_PVZ } from '@/lib/cdek/tariffs';
import type { CdekParcel } from '@/lib/cdek/types';

type Body = {
  cityCode?: unknown;
  parcels?: unknown;
  totalPrice?: unknown;
  /** Optional; defaults to pickup-point delivery in the service layer. */
  tariffCode?: unknown;
};

/** Only tariffs the shop actually offers may be priced from the client. */
const ALLOWED_TARIFFS = [CDEK_TARIFF_PVZ, CDEK_TARIFF_COURIER];

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

  const requestedTariff = Number(body.tariffCode);
  const tariffCode = ALLOWED_TARIFFS.includes(requestedTariff)
    ? requestedTariff
    : CDEK_TARIFF_PVZ;

  try {
    const quote = await calculateQuote(cityCode, parcels, totalPrice, tariffCode);
    return NextResponse.json(quote);
  } catch (error) {
    console.error(`CDEK quote error (tariff ${tariffCode})`, error);
    // The client localizes using `reason`; this label is only a fallback for
    // non-UI consumers, so it must not assume a delivery method.
    return cdekErrorResponse(error, 'Не удалось рассчитать доставку.');
  }
}
