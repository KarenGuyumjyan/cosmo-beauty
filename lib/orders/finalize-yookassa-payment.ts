import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { buildParcelsFromOrderLines } from '@/lib/cdek/build-parcels'
import { createCdekOrder } from '@/lib/cdek/service'
import { sendOrderNotification } from '@/lib/telegram'
import type { OrderWithItemsAndProduct } from '@/lib/types/order-with-relations'

/**
 * Atomically marks a PENDING order as PAID and runs post-payment side effects once.
 * Safe under concurrent webhook + thank-you page requests.
 */
export async function finalizeOrderPaidViaYooKassa(
  order: OrderWithItemsAndProduct,
): Promise<'paid' | 'already_paid' | 'not_pending'> {
  // Atomically flip status from PENDING → PAID *and* decrement stock in one
  // transaction so duplicate webhook deliveries (webhook + thank-you page race)
  // cannot double-decrement inventory.
  const transition = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: 'PENDING' },
      data: { status: 'PAID', yookassaStatus: 'succeeded' },
    })

    if (updated.count === 0) return { transitioned: false as const }

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      })
    }

    return { transitioned: true as const }
  })

  if (!transition.transitioned) {
    const current = await prisma.order.findUnique({
      where: { id: order.id },
      select: { status: true },
    })
    return current?.status === 'PAID' ? 'already_paid' : 'not_pending'
  }

  console.info(
    `[yookassa] Order ${order.id} set to PAID (payment ${order.yookassaId ?? 'unknown'})`,
  )

  if (
    !order.cdekUuid &&
    order.cityCode &&
    order.pickupPointCode &&
    order.tariffCode
  ) {
    try {
      const cdek = await createCdekOrder({
        orderNumber: order.id.slice(0, 12),
        cityCode: order.cityCode,
        pickupPointCode: order.pickupPointCode,
        tariffCode: order.tariffCode,
        recipientName: order.customerName,
        recipientPhone: order.customerPhone,
        recipientEmail: order.customerEmail,
        parcels: buildParcelsFromOrderLines(order.items),
      })

      await prisma.order.update({
        where: { id: order.id },
        data: {
          cdekUuid: cdek.uuid,
          cdekTrackingNumber: cdek.trackingNumber,
          cdekRawResponse: cdek.rawResponse as Prisma.InputJsonValue,
        },
      })
    } catch (cdekError) {
      console.error(
        `[yookassa] CDEK order creation failed after payment for order ${order.id}`,
        cdekError,
      )
    }
  }

  try {
    await sendOrderNotification({
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      shippingMethod: order.shippingMethod,
      address: order.address,
      city: order.city,
      items: order.items.map((i) => ({
        name: i.product.nameRu || i.product.nameEn,
        quantity: i.quantity,
        price: i.price,
      })),
      shippingCost: order.shippingCost,
      total: order.total,
    })
  } catch (notifyError) {
    console.error(
      `[yookassa] Telegram notification failed after payment for order ${order.id}`,
      notifyError,
    )
  }

  return 'paid'
}

export async function cancelPendingOrderFromYooKassa(
  orderId: string,
): Promise<boolean> {
  const r = await prisma.order.updateMany({
    where: { id: orderId, status: 'PENDING' },
    data: { status: 'CANCELLED', yookassaStatus: 'canceled' },
  })
  if (r.count > 0) {
    console.info(
      `[yookassa] Order ${orderId} set to CANCELLED (YooKassa payment canceled)`,
    )
    return true
  }
  return false
}
