import { Buffer } from 'node:buffer';

const API = 'https://api.yookassa.ru/v3';

/** 54-FZ receipt defaults; override via env if your tax regime differs. */
const TAX_SYSTEM_CODE = Number(process.env.YOOKASSA_TAX_SYSTEM_CODE ?? '1');
const VAT_CODE = Number(process.env.YOOKASSA_VAT_CODE ?? '1');

export interface YooKassaReceiptItem {
  description: string;
  quantity: number;
  /** Line total in whole rubles (price × quantity). */
  amountRub: number;
  /** Defaults to `commodity`; use `service` for delivery. */
  paymentSubject?: 'commodity' | 'service';
}

function normalizeSecretKey(raw: string): string {
  if (raw.startsWith('live_') || raw.startsWith('test_')) return raw;
  // Merchant profile secrets are issued with a live_/test_ prefix; tolerate env without it.
  return `live_${raw}`;
}

/**
 * Resolve shop id + secret even when env vars were saved in the wrong slots.
 * Shop id is numeric; secret is a long token (often live_… / test_…).
 */
function resolveCredentials(): { shopId: string; secretKey: string } {
  const a = process.env.YOOKASSA_SHOP_ID?.trim() ?? '';
  const b = process.env.YOOKASSA_SECRET_KEY?.trim() ?? '';
  if (!a || !b) {
    throw new Error('YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY must be set');
  }

  const aIsShopId = /^\d{4,10}$/.test(a);
  const bIsShopId = /^\d{4,10}$/.test(b);
  const aIsSecret = a.startsWith('live_') || a.startsWith('test_') || (!aIsShopId && a.length >= 20);
  const bIsSecret = b.startsWith('live_') || b.startsWith('test_') || (!bIsShopId && b.length >= 20);

  if (aIsShopId && bIsSecret) {
    return { shopId: a, secretKey: normalizeSecretKey(b) };
  }
  if (bIsShopId && aIsSecret) {
    return { shopId: b, secretKey: normalizeSecretKey(a) };
  }

  // Fallback: documented order shopId:secretKey
  return { shopId: a, secretKey: normalizeSecretKey(b) };
}

/** YooKassa HTTP Basic: username = shopId, password = secretKey. */
function basicAuthorizationHeader(): string {
  const { shopId, secretKey } = resolveCredentials();
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`;
}

export interface CreatePaymentParams {
  amountRub: number
  orderId: string
  returnUrl: string
  description?: string
  customerEmail: string
  receiptItems: YooKassaReceiptItem[]
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

function buildReceipt(
  customerEmail: string,
  items: YooKassaReceiptItem[],
) {
  return {
    customer: { email: customerEmail },
    tax_system_code: TAX_SYSTEM_CODE,
    items: items.map((item) => ({
      description: item.description.slice(0, 128),
      quantity: item.quantity.toFixed(2),
      amount: { value: item.amountRub.toFixed(2), currency: 'RUB' },
      vat_code: VAT_CODE,
      payment_mode: 'full_payment',
      payment_subject: item.paymentSubject ?? 'commodity',
    })),
  };
}

export async function createPayment({
  amountRub,
  orderId,
  returnUrl,
  description,
  customerEmail,
  receiptItems,
}: CreatePaymentParams): Promise<YooKassaPayment> {
  const body = JSON.stringify({
    amount: { value: amountRub.toFixed(2), currency: 'RUB' },
    confirmation: { type: 'redirect', return_url: returnUrl },
    capture: true,
    description: description ?? `Order ${orderId}`,
    metadata: { order_id: orderId },
    receipt: buildReceipt(customerEmail, receiptItems),
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

export async function fetchPayment(paymentId: string): Promise<YooKassaPayment> {
  const res = await fetch(`${API}/payments/${paymentId}`, {
    headers: { Authorization: basicAuthorizationHeader() },
  });
  if (!res.ok) throw new Error(`YooKassa fetch ${res.status}`);
  return res.json();
}
