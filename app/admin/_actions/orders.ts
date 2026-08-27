'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { auth } from '@/auth';
import { syncCdekStatus } from '@/lib/orders/sync-cdek-status';
import { notifyOrderDelivered } from '@/lib/orders/notify-order-delivered';

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  // updateMany + the `not` guard so re-saving the status the order already has
  // is a no-op that cannot re-send the DELIVERED notification. Only the write
  // that actually moves the order reports count > 0.
  const write = await prisma.order.updateMany({
    where: { id: orderId, status: { not: status } },
    data: { status },
  });

  if (write.count > 0 && status === 'DELIVERED') {
    await notifyOrderDelivered(orderId);
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
}

/**
 * Re-read one order's state from CDEK on demand.
 *
 * The nightly cron does this for every in-flight order, but it only helps if
 * the cron is actually firing - and it does not run at all on preview
 * deployments. This gives the admin a way to correct a single order without
 * waiting for (or depending on) the schedule.
 */
export async function syncOrderWithCdek(orderId: string) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      cdekUuid: true,
      cdekTrackingNumber: true,
      status: true,
    },
  });
  if (!order) throw new Error('Order not found');

  const result = await syncCdekStatus(order);

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');

  return result;
}
