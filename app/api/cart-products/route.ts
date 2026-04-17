import { NextResponse } from 'next/server';
import { fetchProductsByIdsForCart } from '@/lib/db-products';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const ids = body && typeof body === 'object' && body !== null && 'ids' in body ? (body as { ids: unknown }).ids : null;
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) {
    return NextResponse.json({ error: 'Expected { ids: string[] }' }, { status: 400 });
  }
  const products = await fetchProductsByIdsForCart(ids);
  return NextResponse.json(products);
}
