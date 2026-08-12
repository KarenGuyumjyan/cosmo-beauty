'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { auth } from '@/auth';
import { syncCdekStatus } from '@/lib/orders/sync-cdek-status';

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  await prisma.order.update({ where: { id: orderId }, data: { status } });
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
