import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import {
  cancelPendingOrderFromYooKassa,
  finalizeOrderPaidViaYooKassa,
} from '@/lib/orders/finalize-yookassa-payment';
import { fetchPayment, validatePaymentMatchesOrder } from '@/lib/yookassa';
import type { OrderWithItemsAndProduct } from '@/lib/types/order-with-relations';
import type { Metadata } from 'next';
import ThankYouClient from './ThankYouClient';
import { buildPageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.order' });
  return buildPageMetadata({
    locale,
    path: `/order/${id}`,
    title: t('title'),
    description: t('description'),
    noIndex: true,
  });
}

export default async function ThankYouPage({ params }: Props) {
  const { locale, id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!order) notFound();

  // If user returns before the webhook runs, sync from YooKassa API (same rules as webhook).
  if (order.status === 'PENDING' && order.yookassaId) {
    try {
      const payment = await fetchPayment(order.yookassaId);
      const match = validatePaymentMatchesOrder(payment, order);
      if (!match.ok) {
        console.warn(
          `[yookassa:return] Order ${order.id}: payment verification failed — ${match.reason}`,
        );
      } else if (payment.status === 'succeeded') {
        const outcome = await finalizeOrderPaidViaYooKassa(order as OrderWithItemsAndProduct);
        if (outcome === 'paid' || outcome === 'already_paid') {
          order.status = 'PAID';
        }
      } else if (payment.status === 'canceled') {
        const cancelled = await cancelPendingOrderFromYooKassa(order.id);
        if (cancelled) {
          order.status = 'CANCELLED';
        }
      }
    } catch (e) {
      console.error(`[yookassa:return] Order ${order.id}: failed to sync payment from YooKassa`, e);
    }
  }

  const serialized = {
    id: order.id,
    status: order.status,
    shippingMethod: order.shippingMethod,
    shippingCost: order.shippingCost,
    subtotal: order.subtotal,
    total: order.total,
    items: order.items.map((i) => ({
      id: i.id,
      name: locale === 'ru' ? i.product.nameRu : locale === 'hy' ? i.product.nameHy : i.product.nameEn,
      quantity: i.quantity,
      price: i.price,
      image: i.product.images[0] ?? '',
    })),
  };

  return <ThankYouClient order={serialized} />;
}
