import { NextResponse } from 'next/server';
import { createCdekOrder } from '@/lib/cdek/service';
import { cdekErrorResponse } from '@/lib/cdek/errors';
import type { CdekParcel } from '@/lib/cdek/types';

type Body = {
  orderNumber?: unknown;
  cityCode?: unknown;
  pickupPointCode?: unknown;
  tariffCode?: unknown;
  recipientName?: unknown;
  recipientPhone?: unknown;
  recipientEmail?: unknown;
  parcels?: unknown;
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

  const orderNumber = String(body.orderNumber ?? '').trim();
  const cityCode = Number(body.cityCode);
  const pickupPointCode = String(body.pickupPointCode ?? '').trim();
  const tariffCode = Number(body.tariffCode);
  const recipientName = String(body.recipientName ?? '').trim();
  const recipientPhone = String(body.recipientPhone ?? '').trim();
  const recipientEmail =
    typeof body.recipientEmail === 'string' && body.recipientEmail.trim()
      ? body.recipientEmail.trim()
      : null;
  const parcels = Array.isArray(body.parcels) ? body.parcels.filter(isParcel) : [];

  if (!orderNumber || !pickupPointCode || !recipientName || !recipientPhone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!Number.isFinite(cityCode) || !Number.isFinite(tariffCode) || parcels.length === 0) {
    return NextResponse.json({ error: 'Invalid cityCode, tariffCode or parcels' }, { status: 400 });
  }

  try {
    const created = await createCdekOrder({
      orderNumber,
      cityCode,
      pickupPointCode,
      tariffCode,
      recipientName,
      recipientPhone,
      recipientEmail,
      parcels,
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error('CDEK create order error', error);
    return cdekErrorResponse(error, 'Failed to create CDEK order');
  }
}
