import { Buffer } from 'node:buffer';

const SHOP_ID = process.env.YOOKASSA_SHOP_ID!;
const SECRET = process.env.YOOKASSA_SECRET_KEY!;
const API = 'https://api.yookassa.ru/v3';

/**
 * YooKassa HTTP Basic: username = shopId, password = secretKey → `shopId:secretKey` before base64.
 * Some setups historically used reversed env placement; we retry on 401 with the other order.
 */
function basicAuthorizationHeader(reversed: boolean): string {
  const pair = reversed ? `${SECRET}:${SHOP_ID}` : `${SHOP_ID}:${SECRET}`;
  return `Basic ${Buffer.from(pair).toString('base64')}`;
}

export interface CreatePaymentParams {
  amountRub: number
  orderId: string
  returnUrl: string
  description?: string
}

export interface YooKassaPayment {
  id: string;
  status: string;
  confirmation?: { confirmation_url: string };
  metadata?: Record<string, unknown>;
  amount?: { value: string; currency: string };
}

/** Normalize metadata.order_id (YooKassa returns string values). */
function metadataOrderId(metadata: Record<string, unknown> | undefined): string | undefined {
  const raw = metadata?.order_id;
  if (typeof raw === 'string') return raw;
  if (raw != null && typeof raw !== 'object') return String(raw);
  return undefined;
}

/**
 * Confirms the payment object from YooKassa belongs to this order (metadata + amount).
 * Always use after loading the payment via the API — never trust webhook JSON alone.
 */
export function validatePaymentMatchesOrder(
  payment: YooKassaPayment,
  order: { id: string; total: number },
): { ok: true } | { ok: false; reason: string } {
  const metaOrderId = metadataOrderId(payment.metadata);
  if (metaOrderId !== order.id) {
    return {
      ok: false,
      reason: `metadata.order_id mismatch (got ${metaOrderId ?? 'none'}, expected ${order.id})`,
    };
  }

  const currency = payment.amount?.currency;
  if (currency && currency !== 'RUB') {
    return { ok: false, reason: `unexpected currency: ${currency}` };
  }

  const valueStr = payment.amount?.value;
  if (!valueStr) {
    return { ok: false, reason: 'payment amount missing' };
  }

  const amountNum = Number.parseFloat(valueStr);
  if (!Number.isFinite(amountNum)) {
    return { ok: false, reason: `invalid amount value: ${valueStr}` };
  }

  // Order totals are whole rubles; YooKassa uses two decimal places
  if (Math.abs(amountNum - order.total) > 0.01) {
    return {
      ok: false,
      reason: `amount mismatch (payment ${amountNum} RUB vs order ${order.total} RUB)`,
    };
  }

  return { ok: true };
}

export async function createPayment({
  amountRub,
  orderId,
  returnUrl,
  description,
}: CreatePaymentParams): Promise<YooKassaPayment> {
  const body = JSON.stringify({
    amount: { value: amountRub.toFixed(2), currency: 'RUB' },
    confirmation: { type: 'redirect', return_url: returnUrl },
    capture: true,
    description: description ?? `Order ${orderId}`,
    metadata: { order_id: orderId },
  });

  const post = (idempotenceKey: string, reversed: boolean) =>
    fetch(`${API}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
        Authorization: basicAuthorizationHeader(reversed),
      },
      body,
    });

  let res = await post(orderId, false);
  if (res.status === 401) {
    res = await post(`${orderId}:auth-retry`, true);
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`YooKassa ${res.status}: ${errBody}`);
  }

  return res.json();
}

export async function fetchPayment(paymentId: string): Promise<YooKassaPayment> {
  const get = (reversed: boolean) =>
    fetch(`${API}/payments/${paymentId}`, {
      headers: { Authorization: basicAuthorizationHeader(reversed) },
    });

  let res = await get(false);
  if (res.status === 401) {
    res = await get(true);
  }
  if (!res.ok) throw new Error(`YooKassa fetch ${res.status}`);
  return res.json();
}
