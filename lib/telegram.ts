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

  const itemLines = order.items
    .map(
      (i) =>
        `  • ${i.name} — ${i.quantity} × ${i.price.toLocaleString('ru-RU')} ₽ = ${(i.price * i.quantity).toLocaleString('ru-RU')} ₽`,
    )
    .join('\n');

  const text = [
    '✨ Новый заказ',
    ' ',
    `Номер заказа — #${order.orderId}`,
    `Имя — ${order.customerName}`,
    `📞 Номер телефона — ${order.customerPhone}`,
    order.customerEmail ? `✉️ Эл. почта — ${order.customerEmail}` : null,
    `📦 Тип доставки: ${order.shippingMethod.trim() === 'CDEK_PICKUP' ? 'ПВЗ CDEК' : order.shippingMethod.trim()}`,
    order.address ? `📍 Адрес: ${order.address}` : null,
    ' ',
    '🛒 Товары:',
    itemLines,
    ' ',
    order.shippingCost > 0
      ? `🚚 Доставка: ${order.shippingCost.toLocaleString('ru-RU')} ₽`
      : null,
    `💰 Итого: ${order.total.toLocaleString('ru-RU')} ₽`,
    '——————————————————',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text }),
    });
  } catch (e) {
    console.error('Telegram notification failed', e);
  }
}
