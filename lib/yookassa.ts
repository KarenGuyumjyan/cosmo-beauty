const SHOP_ID = process.env.YOOKASSA_SHOP_ID!;
const SECRET = process.env.YOOKASSA_SECRET_KEY!;
const API = 'https://api.yookassa.ru/v3';

function headers(idempotencyKey: string) {
  return {
    'Content-Type': 'application/json',
    'Idempotence-Key': idempotencyKey,
    Authorization: `Basic ${Buffer.from(`${SHOP_ID}:${SECRET}`).toString('base64')}`,
  };
}

export interface CreatePaymentParams {
  amountRub: number;
  orderId: string;
  returnUrl: string;
  description?: string;
}

export interface YooKassaPayment {
  id: string;
  status: string;
  confirmation?: { confirmation_url: string };
}

export async function createPayment({
  amountRub,
  orderId,
  returnUrl,
  description,
}: CreatePaymentParams): Promise<YooKassaPayment> {
  const res = await fetch(`${API}/payments`, {
    method: 'POST',
    headers: headers(orderId),
    body: JSON.stringify({
      amount: { value: amountRub.toFixed(2), currency: 'RUB' },
      confirmation: { type: 'redirect', return_url: returnUrl },
      capture: true,
      description: description ?? `Order ${orderId}`,
      metadata: { order_id: orderId },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YooKassa ${res.status}: ${body}`);
  }

  return res.json();
}

export async function fetchPayment(paymentId: string): Promise<YooKassaPayment> {
  const res = await fetch(`${API}/payments/${paymentId}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${SHOP_ID}:${SECRET}`).toString('base64')}`,
    },
  });
  if (!res.ok) throw new Error(`YooKassa fetch ${res.status}`);
  return res.json();
}
