import { MAIL_FROM, transporter } from './transporter'
import { SHOP_CONTACT_PHONE, SHOP_PICKUP_ADDRESS } from '@/lib/shop'

/**
 * The order fields the delivered notice needs. Deliberately narrow so callers
 * can select just these columns instead of loading the whole order graph.
 */
export interface DeliveredEmailOrder {
  id: string
  customerEmail: string
  shippingMethod: string
  address: string | null
  city: string | null
  pickupPointName: string | null
  pickupPointAddress: string | null
}

interface SendOrderDeliveredEmailInput {
  order: DeliveredEmailOrder
  /** Public order page, used as the "details" link in the mail. */
  trackingLink: string
}

/** Rendered pickup block: same content for the text and HTML bodies. */
interface PickupDetails {
  subject: string
  /** Sentence that opens the mail, after the greeting. */
  intro: string
  /** Label/value rows describing where to collect the order. */
  rows: { label: string; value: string }[]
  /** Extra instruction shown below the rows, e.g. the call-ahead notice. */
  note: string | null
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** "Москва, ул. Ленина 1" - drops the city when it is missing or repeated. */
function fullAddress(order: DeliveredEmailOrder): string | null {
  const address = order.address?.trim()
  const city = order.city?.trim()
  if (!address) return city || null
  if (!city || address.includes(city)) return address
  return `${city}, ${address}`
}

/**
 * Build the "where to collect it" part of the mail from the shipping method.
 *
 * CDEK_COURIER is delivered to the door, so it gets no pickup instructions -
 * only a confirmation of the address it went to. The two pickup methods point
 * at their respective locations, and SHOP_PICKUP additionally asks the customer
 * to call ahead.
 */
function buildPickupDetails(order: DeliveredEmailOrder): PickupDetails {
  const method = order.shippingMethod.trim()

  if (method === 'SHOP_PICKUP') {
    return {
      subject: 'Ваш заказ готов к выдаче 🎁',
      intro:
        'Ваш заказ готов и ожидает вас в нашем магазине - вы можете забрать его по адресу ниже.',
      rows: [{ label: 'Адрес магазина', value: SHOP_PICKUP_ADDRESS }],
      note: `Пожалуйста, позвоните нам заранее, перед тем как приехать за заказом: ${SHOP_CONTACT_PHONE}`,
    }
  }

  if (method === 'CDEK_COURIER') {
    const address = fullAddress(order)
    return {
      subject: 'Ваш заказ доставлен 🎁',
      intro: 'Ваш заказ доставлен курьером СДЭК.',
      rows: address ? [{ label: 'Адрес доставки', value: address }] : [],
      note: null,
    }
  }

  if (method === 'CDEK_PICKUP') {
    const rows: { label: string; value: string }[] = []
    if (order.pickupPointName) {
      rows.push({ label: 'Пункт выдачи', value: order.pickupPointName })
    }
    const address = order.pickupPointAddress?.trim() || fullAddress(order)
    if (address) rows.push({ label: 'Адрес', value: address })

    return {
      subject: 'Ваш заказ доставлен в пункт выдачи 🎁',
      intro:
        'Ваш заказ доставлен в пункт выдачи СДЭК - вы можете забрать его по адресу ниже.',
      rows,
      note: 'Не забудьте взять с собой документ, удостоверяющий личность, и номер заказа.',
    }
  }

  // Unknown or legacy shipping method: confirm delivery without inventing a
  // pickup location, and show whatever address the order carries.
  const address = fullAddress(order)
  return {
    subject: 'Ваш заказ доставлен 🎁',
    intro: 'Ваш заказ доставлен.',
    rows: address ? [{ label: 'Адрес', value: address }] : [],
    note: null,
  }
}

export async function sendOrderDeliveredEmail({
  order,
  trackingLink,
}: SendOrderDeliveredEmailInput) {
  const { subject, intro, rows, note } = buildPickupDetails(order)

  const text = [
    'Здравствуйте!',
    '',
    intro,
    ...(rows.length
      ? ['', ...rows.map((row) => `${row.label}: ${row.value}`)]
      : []),
    ...(note ? ['', note] : []),
    '',
    `Номер заказа: ${order.id}`,
    `Детали заказа: ${trackingLink}`,
    '',
    'Спасибо, что выбрали Morena Cosmetics. Если у вас возникнут вопросы, мы всегда будем рады помочь.',
    '',
    'С уважением,',
    'Команда Morena Cosmetics',
  ].join('\n')

  const rowsHtml = rows.length
    ? `<p>${rows
        .map(
          (row) =>
            `<strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.value)}`,
        )
        .join('<br />')}</p>`
    : ''

  const html = `
    <p>Здравствуйте!</p>

    <p>${escapeHtml(intro)}</p>

    ${rowsHtml}

    ${note ? `<p><strong>${escapeHtml(note)}</strong></p>` : ''}

    <p>
      <strong>Номер заказа:</strong> ${escapeHtml(order.id)}<br />
      <a href="${trackingLink}">Посмотреть детали заказа</a>
    </p>

    <p>Спасибо, что выбрали <strong>Morena Cosmetics</strong>. Если у вас возникнут вопросы, мы всегда будем рады помочь.</p>

    <p>
      С уважением,<br />
      <strong>Команда Morena Cosmetics</strong>
    </p>
  `

  await transporter.sendMail({
    from: MAIL_FROM,
    to: order.customerEmail,
    subject,
    text,
    html,
  })
}
