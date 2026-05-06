'use server'

import type { CdekDeliverySelection } from '@/lib/cdek/types'
import { createCdekOrder } from '@/lib/cdek'
import { prisma } from '@/lib/prisma'
import { createPayment } from '@/lib/yookassa'

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
  delivery: CdekDeliverySelection
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
  if (!delivery.city || !delivery.pickupPointCode) {
    return { error: 'CDEK pickup point is required' }
  }
  if (delivery.finalPrice <= 0) {
    return { error: 'Delivery price must be greater than 0' }
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
  const shippingCost = delivery.finalPrice
  const total = subtotal + shippingCost

  const order = await prisma.order.create({
    data: {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      shippingMethod: 'CDEK_PICKUP',
      city: delivery.city,
      cityCode: delivery.cityCode,
      address: delivery.pickupPointAddress,
      pickupPointCode: delivery.pickupPointCode,
      pickupPointName: delivery.pickupPointName,
      pickupPointAddress: delivery.pickupPointAddress,
      tariffCode: delivery.tariffCode,
      cdekPrice: delivery.cdekPrice,
      finalPrice: delivery.finalPrice,
      shippingCost,
      subtotal,
      total,
      status: 'PENDING',
      items: { create: orderItems },
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const returnUrl = `${baseUrl}/${locale}/order/${order.id}`

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

    // Register order with CDEK
    try {
      const cdekResponse = await createCdekOrder({
        tariff_code: delivery.tariffCode,
        delivery_point: delivery.pickupPointCode,
        recipient: {
          name: customerName.trim(),
          phones: [{ number: customerPhone.trim() }],
          email: customerEmail?.trim(),
        },
        from_location: {
          address: process.env.CDEK_SENDER_ADDRESS ?? 'Москва',
          code: Number(process.env.CDEK_SENDER_CITY_CODE) || 44,
        },
        services: [{ code: 'INSURANCE', parameter: 0 }],
        packages: [
          {
            number: order.id.slice(0, 8),
            weight: orderItems.reduce((sum, i) => sum + i.quantity * 100, 0), // grams
            items: orderItems.map((item) => {
              const p = productMap.get(item.productId)!
              return {
                name: p.nameEn,
                ware_key: item.productId.slice(0, 20),
                weight: 100,
                amount: item.quantity,
                cost: item.price,
                payment: { value: 0 },
              }
            }),
          },
        ],
      })

      const cdekUuid = cdekResponse.entity?.uuid
      if (cdekUuid) {
        await prisma.order.update({
          where: { id: order.id },
          data: { cdekUuid },
        })
      }
    } catch (cdekErr) {
      console.error('CDEK order registration failed (non-blocking)', cdekErr)
    }

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
