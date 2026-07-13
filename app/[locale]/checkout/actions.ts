'use server'

import type { CdekDeliverySelection } from '@/lib/cdek/types'
import { prisma } from '@/lib/prisma'
import { BASE_URL } from '@/lib/seo'
import { createPayment } from '@/lib/yookassa'

type StockRow = { id: string; stockQuantity: number; nameEn: string }

type DeliveryMethod = 'cdek' | 'yandex' | 'pickup'

const SHIPPING_METHOD_MAP: Record<DeliveryMethod, string> = {
  cdek: 'CDEK_PICKUP',
  yandex: 'YANDEX_PICKUP',
  pickup: 'STORE_PICKUP',
}

const SHIPPING_LABEL_MAP: Record<DeliveryMethod, string> = {
  cdek: 'Доставка СДЭК (ПВЗ)',
  yandex: 'Доставка Яндекс (ПВЗ)',
  pickup: 'Самовывоз',
}

/** Returns a user-facing error string if any item fails the stock check, otherwise null. */
function stockError(
  items: { productId: string; quantity: number }[],
  map: Map<string, StockRow>,
): string | null {
  for (const item of items) {
    const p = map.get(item.productId)
    if (!p)
      return 'One or more products were not found. Please refresh your cart.'
    if (p.stockQuantity <= 0)
      return `"${p.nameEn}" is out of stock. Please remove it from your cart.`
    if (item.quantity > p.stockQuantity)
      return `"${p.nameEn}": only ${p.stockQuantity} left in stock (you requested ${item.quantity}). Please update your cart.`
  }
  return null
}

interface CheckoutInput {
  customerName: string
  customerPhone: string
  customerEmail: string
  delivery: CdekDeliverySelection | null
  deliveryMethod: DeliveryMethod
  items: { productId: string; quantity: number }[]
  locale: string
}

export async function createOrder(
  input: CheckoutInput,
): Promise<{ error: string } | { paymentUrl: string; orderId: string }> {
  const {
    customerName,
    customerPhone,
    customerEmail,
    delivery,
    deliveryMethod,
    items,
    locale,
  } = input

  if (!customerName.trim()) return { error: 'Name is required' }
  if (!customerPhone.trim()) return { error: 'Phone is required' }
  if (!items.length) return { error: 'Cart is empty' }

  // Only CDEK pickup has a computed pickup point + price; the other pickup
  // methods (Yandex, in-store) are free and don't carry a `delivery`
  // selection at all.
  if (deliveryMethod === 'cdek') {
    if (!delivery || !delivery.city || !delivery.pickupPointCode) {
      return { error: 'CDEK pickup point is required' }
    }
    if (delivery.finalPrice <= 0) {
      return { error: 'Delivery price must be greater than 0' }
    }
  }

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: {
      id: true,
      price: true,
      discountedPrice: true,
      stockQuantity: true,
      nameEn: true,
      nameRu: true,
    },
  })

  const productMap = new Map(products.map((p) => [p.id, p]))

  const earlyStockErr = stockError(items, productMap)
  if (earlyStockErr) return { error: earlyStockErr }

  const orderItems = items.map((item) => {
    const p = productMap.get(item.productId)!
    return {
      productId: p.id,
      quantity: item.quantity,
      price: p.discountedPrice ?? p.price,
    }
  })

  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const shippingCost = deliveryMethod === 'cdek' ? delivery!.finalPrice : 0
  const total = subtotal + shippingCost

  const order = await prisma.order.create({
    data: {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      shippingMethod: SHIPPING_METHOD_MAP[deliveryMethod],
      city: delivery?.city ?? null,
      cityCode: delivery?.cityCode ?? null,
      address: delivery?.pickupPointAddress ?? null,
      pickupPointCode: delivery?.pickupPointCode ?? null,
      pickupPointName: delivery?.pickupPointName ?? null,
      pickupPointAddress: delivery?.pickupPointAddress ?? null,
      tariffCode: delivery?.tariffCode ?? null,
      cdekPrice: delivery?.cdekPrice ?? null,
      finalPrice: delivery?.finalPrice ?? 0,
      shippingCost,
      subtotal,
      total,
      status: 'PENDING',
      items: { create: orderItems },
    },
  })

  const baseUrl = BASE_URL
  const returnUrl = `${baseUrl}/${locale}/order/${order.id}`

  const receiptItems = [
    ...orderItems.map((item) => {
      const p = productMap.get(item.productId)!
      return {
        description: p.nameRu,
        quantity: item.quantity,
        amountRub: item.price * item.quantity,
      }
    }),
    // Only add a delivery line item when it's actually charged for;
    // free pickup methods have nothing to list here.
    ...(shippingCost > 0
      ? [
          {
            description: SHIPPING_LABEL_MAP[deliveryMethod],
            quantity: 1,
            amountRub: shippingCost,
            paymentSubject: 'service' as const,
          },
        ]
      : []),
  ]

  try {
    // Re-fetch stock right before payment to close the race window between
    // initial validation and actual payment creation.
    const freshRows = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
      select: { id: true, stockQuantity: true, nameEn: true },
    })
    const freshMap = new Map(freshRows.map((p) => [p.id, p]))
    const lateStockErr = stockError(items, freshMap)
    if (lateStockErr) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      })
      return { error: lateStockErr }
    }

    const payment = await createPayment({
      amountRub: total,
      orderId: order.id,
      returnUrl,
      description: `Morena Cosmetics order #${order.id.slice(0, 8)}`,
      customerEmail: customerEmail.trim(),
      receiptItems,
    })

    if (!payment) {
      throw new Error(
        'Payment creation failed: no response from payment gateway',
      )
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { yookassaId: payment.id, yookassaStatus: payment.status },
    })

    // NB: CDEK order is intentionally NOT created here.
    // It is created in `finalizeOrderPaidViaYooKassa` after the payment
    // succeeds - registering CDEK orders for abandoned/unpaid carts pollutes
    // CDEK's system and incurs needless reservations.
    // (Only applies to deliveryMethod === 'cdek'; other pickup methods
    // never touch the CDEK API.)

    const confirmUrl = payment.confirmation?.confirmation_url
    if (!confirmUrl) {
      return { error: 'Payment gateway did not return a redirect URL' }
    }

    return { paymentUrl: confirmUrl, orderId: order.id }
  } catch (e) {
    console.error('Payment creation failed', e)
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    })
    return { error: 'Payment failed. Please try again.' }
  }
}
