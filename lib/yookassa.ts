import { Buffer } from 'node:buffer';

const SHOP_ID = process.env.YOOKASSA_SHOP_ID!;
const SECRET = process.env.YOOKASSA_SECRET_KEY!;
const API = 'https://api.yookassa.ru/v3';

/**
 * YooKassa HTTP Basic: username = shopId, password = secretKey → `shopId:secretKey` before base64.
 * Put the numeric shopId in YOOKASSA_SHOP_ID and the `live_`/`test_` key in
 * YOOKASSA_SECRET_KEY - the two are NOT interchangeable.
 */
function basicAuthorizationHeader(): string {
  return `Basic ${Buffer.from(`${SHOP_ID}:${SECRET}`).toString('base64')}`;
}

/** One line item on the fiscal receipt (54-ФЗ). `amountRub` is the price per single unit. */
export interface ReceiptItemInput {
  description: string
  amountRub: number
  quantity: number
  vatCode: number
  isShipping?: boolean
}

export interface ReceiptInput {
  email?: string
  phone?: string
  items: ReceiptItemInput[]
}

export interface CreatePaymentParams {
  amountRub: number
  orderId: string
  returnUrl: string
  description?: string
  receipt?: ReceiptInput
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
 * Always use after loading the payment via the API - never trust webhook JSON alone.
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
  receipt,
}: CreatePaymentParams): Promise<YooKassaPayment> {
  const body = JSON.stringify({
    amount: { value: amountRub.toFixed(2), currency: 'RUB' },
    confirmation: { type: 'redirect', return_url: returnUrl },
    capture: true,
    description: description ?? `Order ${orderId}`,
    metadata: { order_id: orderId },
    ...(receipt ? { receipt: buildReceipt(receipt) } : {}),
  });

  const res = await fetch(`${API}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotence-Key': orderId,
      Authorization: basicAuthorizationHeader(),
    },
    body,
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`YooKassa ${res.status}: ${errBody}`);
  }

  return res.json();
}

/**
 * Builds a 54-ФЗ receipt. YooKassa requires the sum of item (amount × quantity)
 * to equal the payment amount, so shipping must be its own line item.
 */
function buildReceipt(receipt: ReceiptInput) {
  const phone = receipt.phone?.replace(/\D/g, '');
  const customer: Record<string, string> = {};
  if (receipt.email) customer.email = receipt.email;
  if (phone) customer.phone = phone;

  return {
    customer,
    items: receipt.items.map((item) => ({
      description: item.description.slice(0, 128),
      quantity: item.quantity.toFixed(2),
      amount: { value: item.amountRub.toFixed(2), currency: 'RUB' },
      vat_code: item.vatCode,
      payment_mode: 'full_payment',
      payment_subject: item.isShipping ? 'service' : 'commodity',
    })),
  };
}

export async function fetchPayment(paymentId: string): Promise<YooKassaPayment> {
  const res = await fetch(`${API}/payments/${paymentId}`, {
    headers: { Authorization: basicAuthorizationHeader() },
  });
  if (!res.ok) throw new Error(`YooKassa fetch ${res.status}`);
  return res.json();
}
