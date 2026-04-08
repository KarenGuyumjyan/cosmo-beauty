import { NextResponse } from 'next/server';
import { estimateDelivery } from '@/lib/yandex-delivery';

export async function POST(req: Request) {
  try {
    const { city, address } = (await req.json()) as { city?: string; address?: string };
    if (!city || !address) {
      return NextResponse.json({ error: 'city and address required' }, { status: 400 });
    }

    const result = await estimateDelivery(`${city}, ${address}`);
    return NextResponse.json(result);
  } catch (e) {
    console.error('Delivery estimate error', e);
    return NextResponse.json({ error: 'Failed to estimate delivery' }, { status: 500 });
  }
}
