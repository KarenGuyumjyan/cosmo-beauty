'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { auth } from '@/auth';

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  await prisma.order.update({ where: { id: orderId }, data: { status } });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
}
