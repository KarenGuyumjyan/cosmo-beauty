import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchPayment, validatePaymentMatchesOrder } from '@/lib/yookassa';
import type { OrderWithItemsAndProduct } from '@/lib/types/order-with-relations';
import {
  cancelPendingOrderFromYooKassa,
  finalizeOrderPaidViaYooKassa,
} from '@/lib/orders/finalize-yookassa-payment';

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      console.warn('[yookassa:webhook] Rejected: body is not valid JSON');
      return NextResponse.json({ ok: true });
    }

    const payload = body as Record<string, unknown>;

    if (payload.type != null && payload.type !== 'notification') {
      console.warn('[yookassa:webhook] Ignoring message with unexpected type:', payload.type);
      return NextResponse.json({ ok: true });
    }

    const paymentStub = payload.object as Record<string, unknown> | undefined;
    const paymentId = typeof paymentStub?.id === 'string' ? paymentStub.id : undefined;
    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    const event = typeof payload.event === 'string' ? payload.event : undefined;

    const order = (await prisma.order.findFirst({
      where: { yookassaId: paymentId },
      include: { items: { include: { product: true } } },
    })) as OrderWithItemsAndProduct | null;

    if (!order) {
      console.warn(
        `[yookassa:webhook] No order for YooKassa payment ${paymentId} (event=${event ?? 'unknown'})`,
      );
      return NextResponse.json({ ok: true });
    }

    let payment;
    try {
      payment = await fetchPayment(paymentId);
    } catch (e) {
      console.error(
        `[yookassa:webhook] YooKassa API fetch failed for payment ${paymentId} (order ${order.id}); responding 500 so YooKassa retries`,
        e,
      );
      return NextResponse.json({ error: 'yookassa_unavailable' }, { status: 500 });
    }

    const validation = validatePaymentMatchesOrder(payment, order);
    if (!validation.ok) {
      console.warn(
        `[yookassa:webhook] Validation failed payment=${paymentId} order=${order.id}: ${validation.reason}`,
      );
      return NextResponse.json({ ok: true });
    }

    const apiStatus = payment.status;

    if (apiStatus === 'succeeded') {
      const outcome = await finalizeOrderPaidViaYooKassa(order);
      if (outcome === 'paid') {
        console.info(
          `[yookassa:webhook] Payment ${paymentId} succeeded; order ${order.id} finalized (event=${event ?? 'n/a'})`,
        );
      } else if (outcome === 'already_paid') {
        console.info(
          `[yookassa:webhook] Idempotent replay: order ${order.id} already PAID (payment ${paymentId})`,
        );
      } else {
        console.warn(
          `[yookassa:webhook] Payment ${paymentId} succeeded in YooKassa but order ${order.id} was not PENDING (outcome=${outcome}); no DB status change`,
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (apiStatus === 'canceled') {
      const cancelled = await cancelPendingOrderFromYooKassa(order.id);
      if (!cancelled) {
        console.warn(
          `[yookassa:webhook] Payment ${paymentId} canceled in YooKassa; order ${order.id} was not PENDING, skipped cancel`,
        );
      }
      return NextResponse.json({ ok: true });
    }

    console.info(
      `[yookassa:webhook] No action for api status "${apiStatus}" payment=${paymentId} order=${order.id} event=${event ?? 'n/a'}`,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[yookassa:webhook] Unexpected handler error', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
