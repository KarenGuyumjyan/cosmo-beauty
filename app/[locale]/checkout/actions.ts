'use server'

import type { DeliverySelection } from '@/lib/cdek/types'
import { formatCourierAddress } from '@/lib/cdek/format-address'
import { prisma } from '@/lib/prisma'
import { createPayment, type ReceiptItemInput } from '@/lib/yookassa'
import { BASE_URL } from '@/lib/seo'
import { MINIMUM_ORDER_AMOUNT, SHOP_PICKUP_ADDRESS } from '@/lib/shop'

type StockRow = { id: string; stockQuantity: number; nameEn: string }

/** Returns a user-facing error string if any item fails the stock check, otherwise null. */
function stockError(
  items: { productId: string; quantity: number }[],
  map: Map<string, StockRow>,
): string | null {
  for (const item of items) {
    const p = map.get(item.productId)
    if (!p) return 'One or more products were not found. Please refresh your cart.'
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
  delivery: DeliverySelection
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
    items,
    locale,
  } = input

  if (!customerName.trim()) return { error: 'Name is required' }
  if (!customerPhone.trim()) return { error: 'Phone is required' }
  if (delivery.method === 'CDEK_PICKUP') {
    const c = delivery.cdek
    if (!c.city || !c.pickupPointCode) {
      return { error: 'CDEK pickup point is required' }
    }
    if (c.finalPrice <= 0) {
      return { error: 'Delivery price must be greater than 0' }
    }
  }
  if (delivery.method === 'CDEK_COURIER') {
    const c = delivery.cdek
    if (!c.city || !c.address.trim()) {
      return { error: 'Delivery address is required' }
    }
    if (c.finalPrice <= 0) {
      return { error: 'Delivery price must be greater than 0' }
    }
  }
  if (!items.length) return { error: 'Cart is empty' }

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

  // Shop pickup is always free; both CDEK methods carry a quoted price.
  const quotedShipping =
    delivery.method === 'SHOP_PICKUP' ? 0 : delivery.cdek.finalPrice

  // Pickup-point delivery is free from MINIMUM_ORDER_AMOUNT upwards. Courier
  // delivery (tariff 137) is always paid, so the threshold never applies to it.
  const shippingCost =
    delivery.method === 'CDEK_COURIER'
      ? quotedShipping
      : subtotal >= MINIMUM_ORDER_AMOUNT
        ? 0
        : quotedShipping
  const total = subtotal + shippingCost

  // CDEK-specific columns stay null for SHOP_PICKUP so no CDEK order is
  // registered downstream (see finalizeOrderPaidViaYooKassa).
  // Courier orders carry no pickup-point code - the address is the destination,
  // which is exactly how finalizeOrderPaidViaYooKassa tells the two apart.
  const shippingData =
    delivery.method === 'CDEK_PICKUP'
      ? {
          shippingMethod: 'CDEK_PICKUP',
          city: delivery.cdek.city,
          cityCode: delivery.cdek.cityCode,
          address: delivery.cdek.pickupPointAddress,
          pickupPointCode: delivery.cdek.pickupPointCode,
          pickupPointName: delivery.cdek.pickupPointName,
          pickupPointAddress: delivery.cdek.pickupPointAddress,
          tariffCode: delivery.cdek.tariffCode,
          cdekPrice: delivery.cdek.cdekPrice,
          finalPrice: delivery.cdek.finalPrice,
        }
      : delivery.method === 'CDEK_COURIER'
        ? {
            shippingMethod: 'CDEK_COURIER',
            city: delivery.cdek.city,
            cityCode: delivery.cdek.cityCode,
            // Apartment / entrance / floor are folded into the stored line:
            // it is the only address field CDEK and the waybill ever see.
            address: formatCourierAddress(delivery.cdek),
            tariffCode: delivery.cdek.tariffCode,
            cdekPrice: delivery.cdek.cdekPrice,
            finalPrice: delivery.cdek.finalPrice,
          }
        : {
            shippingMethod: 'SHOP_PICKUP',
            address: SHOP_PICKUP_ADDRESS,
          }

  const order = await prisma.order.create({
    data: {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      ...shippingData,
      shippingCost,
      subtotal,
      total,
      status: 'PENDING',
      items: { create: orderItems },
    },
  })

  const returnUrl = `${BASE_URL}/${locale}/order/${order.id}`

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

    // 54-ФЗ receipt: one line per product, plus a shipping line for paid
    // delivery. Shop pickup is free, so it gets no shipping line (a 0₽ line
    // would be rejected and the item sum must equal the payment amount).
    // vatCode 1 = Без НДС.
    const receiptItems: ReceiptItemInput[] = orderItems.map((item) => ({
      description: productMap.get(item.productId)!.nameRu,
      amountRub: item.price,
      quantity: item.quantity,
      vatCode: 1,
    }))
    // The receipt line-item sum MUST equal the charged amount (`total`), or
    // YooKassa rejects the payment. Only bill shipping on the receipt for the
    // part of `total` not covered by the products. Delivery is currently free
    // (total = subtotal), so no shipping line is added; if shipping is later
    // folded into `total`, it reappears here automatically and stays in sync.
    const shippingOnReceipt = total - subtotal
    if (shippingOnReceipt > 0) {
      receiptItems.push({
        description:
          delivery.method === 'CDEK_COURIER'
            ? 'Доставка CDEK (курьер)'
            : 'Доставка CDEK',
        amountRub: shippingOnReceipt,
        quantity: 1,
        vatCode: 1,
        isShipping: true,
      })
    }

    const payment = await createPayment({
      amountRub: total,
      orderId: order.id,
      returnUrl,
      description: `Morena Cosmetics order #${order.id.slice(0, 8)}`,
      receipt: {
        email: customerEmail.trim(),
        phone: customerPhone.trim(),
        items: receiptItems,
      },
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
