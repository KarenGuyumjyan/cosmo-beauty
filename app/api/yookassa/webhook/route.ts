import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { OrderWithItemsAndProduct } from '@/lib/types/order-with-relations';
import { sendOrderNotification } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const event = body?.event as string | undefined;
    const payment = body?.object;

    if (!payment?.id) {
      return NextResponse.json({ ok: true });
    }

    const paymentId = payment.id as string;
    const status = payment.status as string;

    const order = (await prisma.order.findFirst({
      where: { yookassaId: paymentId } as Prisma.OrderWhereInput,
      include: { items: { include: { product: true } } },
    })) as OrderWithItemsAndProduct | null;

    if (!order) {
      console.warn(`Webhook: no order for payment ${paymentId}`);
      return NextResponse.json({ ok: true });
    }

    if (event === 'payment.succeeded' || status === 'succeeded') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID', yookassaStatus: 'succeeded' } as Prisma.OrderUpdateInput,
      });

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
      });
    } else if (event === 'payment.canceled' || status === 'canceled') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED', yookassaStatus: 'canceled' } as Prisma.OrderUpdateInput,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Webhook error', e);
    return NextResponse.json({ ok: true });
  }
}
