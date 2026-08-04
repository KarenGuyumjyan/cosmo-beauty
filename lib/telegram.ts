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
  yookassaId?: string | null;
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

  const method = order.shippingMethod.trim();
  const methodLabel =
    method === 'CDEK_PICKUP'
      ? 'ПВЗ CDEК'
      : method === 'CDEK_COURIER'
        ? 'Курьер CDEК'
        : method === 'SHOP_PICKUP'
          ? 'Самовывоз из магазина'
          : method;

  const text = [
    '✨ Новый заказ',
    ' ',
    `Номер заказа — https://www.morena-cosmetics.ru/ru/order/${order.orderId}`,
    `Имя — ${order.customerName}`,
    `📞 Номер телефона — ${order.customerPhone}`,
    order.customerEmail ? `✉️ Эл. почта — ${order.customerEmail}` : null,
    `📦 Тип доставки: ${methodLabel}`,
    ((methodLabel === 'ПВЗ CDEК' || methodLabel === 'Курьер CDEК') &&
      `CDEK - Номер ИМ в сдэк: ${order.orderId.slice(0, 12)}`) ||
      null,
    order.address ? `📍 Адрес: ${order.address}` : null,
    order.yookassaId ? `💳 Код платежа YooKassa — ${order.yookassaId}` : null,
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
