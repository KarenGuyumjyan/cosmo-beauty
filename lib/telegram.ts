const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? '';

interface OrderNotification {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  shippingMethod: string;
  address?: string | null;
  city?: string | null;
  items: { name: string; quantity: number; price: number }[];
  shippingCost: number;
  total: number;
}

export async function sendOrderNotification(order: OrderNotification) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('Telegram not configured, skipping notification');
    return;
  }

  const shippingLabel = [order.shippingMethod.trim(), order.city, order.address]
    .filter(Boolean)
    .join(' · ') || '-';

  const itemLines = order.items
    .map((i) => `  • ${i.name} x${i.quantity} - ${(i.price * i.quantity).toLocaleString('ru-RU')} ₽`)
    .join('\n');

  const text = [
    `🛍 New order #${order.orderId.slice(0, 8)}`,
    '',
    `👤 ${order.customerName}`,
    `📞 ${order.customerPhone}`,
    order.customerEmail ? `📧 ${order.customerEmail}` : null,
    '',
    `📦 ${shippingLabel}`,
    '',
    itemLines,
    '',
    order.shippingCost > 0
      ? `🚚 Delivery: ${order.shippingCost.toLocaleString('ru-RU')} ₽`
      : null,
    `💰 Total: ${order.total.toLocaleString('ru-RU')} ₽`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
    });
  } catch (e) {
    console.error('Telegram notification failed', e);
  }
}
