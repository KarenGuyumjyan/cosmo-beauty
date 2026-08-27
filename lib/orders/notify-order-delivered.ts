import { prisma } from '@/lib/prisma'
import { sendOrderDeliveredEmail } from '@/lib/email/send-order-delivered-email'
import { BASE_URL } from '@/lib/seo'

/**
 * Tell the customer their order has arrived and where to collect it.
 *
 * Called from the two places an order can reach DELIVERED - the CDEK reconcile
 * cron (via syncCdekStatus) and the admin status dropdown - so both send the
 * same mail. Both callers only invoke this on an actual transition into
 * DELIVERED, which is what keeps the mail from repeating on every poll.
 *
 * Never throws: a mail failure must not roll back or abort the status update
 * that triggered it.
 */
export async function notifyOrderDelivered(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customerEmail: true,
        shippingMethod: true,
        address: true,
        city: true,
        pickupPointName: true,
        pickupPointAddress: true,
      },
    })

    if (!order) {
      console.warn(`[order:delivered] Order ${orderId} not found, skipping mail`)
      return
    }

    // customerEmail is optional at checkout - phone-only orders get no mail.
    if (!order.customerEmail) {
      console.info(
        `[order:delivered] Order ${orderId} has no customer email, skipping mail`,
      )
      return
    }

    await sendOrderDeliveredEmail({
      order: { ...order, customerEmail: order.customerEmail },
      trackingLink: `${BASE_URL}/ru/order/${order.id}`,
    })

    console.info(
      `[order:delivered] Delivery email sent for order ${orderId} (${order.shippingMethod.trim() || 'unknown method'})`,
    )
  } catch (error) {
    console.error(
      `[order:delivered] Failed to send delivery email for order ${orderId}`,
      error,
    )
  }
}
