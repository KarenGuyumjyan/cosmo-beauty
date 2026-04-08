const TOKEN = process.env.YANDEX_DELIVERY_TOKEN ?? '';
const API = 'https://b2b.taxi.yandex.net/b2b/cargo/integration/v2';

const WAREHOUSE_LAT = Number(process.env.WAREHOUSE_LAT ?? '55.751244');
const WAREHOUSE_LON = Number(process.env.WAREHOUSE_LON ?? '37.618423');

export interface DeliveryEstimate {
  price: number;
  currency: string;
  estimatedDays?: string;
}

/**
 * Estimate delivery cost via Yandex Delivery check-price endpoint.
 * Falls back to a flat rate if the token is not configured (dev mode).
 */
export async function estimateDelivery(destAddress: string): Promise<DeliveryEstimate> {
  if (!TOKEN) {
    return { price: 350, currency: 'RUB', estimatedDays: '2-4' };
  }

  const res = await fetch(`${API}/check-price`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': 'ru',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      items: [{ quantity: 1, size: { height: 0.1, length: 0.2, width: 0.15 }, weight: 0.3 }],
      route_points: [
        { coordinates: [WAREHOUSE_LON, WAREHOUSE_LAT] },
        { fullname: destAddress },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Yandex Delivery error', res.status, text);
    return { price: 350, currency: 'RUB', estimatedDays: '2-5' };
  }

  const data = await res.json();
  const offer = data?.price ?? data?.pricing_total;
  const price = typeof offer === 'number' ? Math.ceil(offer) : 350;

  return { price, currency: 'RUB', estimatedDays: '2-5' };
}
